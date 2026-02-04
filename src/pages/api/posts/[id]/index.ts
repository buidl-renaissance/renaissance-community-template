import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { posts, postLikes, postComments, users } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getUserById, isAdmin } from '@/db/user';

type PostWithUser = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};

type GetResponseData = {
  post: PostWithUser;
};

type PutResponseData = {
  success: boolean;
  post: PostWithUser;
};

type DeleteResponseData = {
  success: boolean;
  message: string;
};

type ErrorResponse = {
  error: string;
};

// Helper to get user from request
async function getUserFromRequest(req: NextApiRequest) {
  if (req.query.userId && typeof req.query.userId === 'string') {
    return await getUserById(req.query.userId);
  }

  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  
  if (sessionMatch && sessionMatch[1]) {
    return await getUserById(sessionMatch[1]);
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponseData | PutResponseData | DeleteResponseData | ErrorResponse>
) {
  const db = getDb();
  const postId = req.query.id as string;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const currentUser = await getUserFromRequest(req);

      // Get post with user info
      const postWithUser = await db
        .select({
          id: posts.id,
          content: posts.content,
          imageUrl: posts.imageUrl,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          userId: posts.userId,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, postId))
        .limit(1);

      if (postWithUser.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const p = postWithUser[0];

      // Get like count
      const likeCountResult = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));

      const likeCount = likeCountResult[0]?.count || 0;

      // Get comment count
      const commentCountResult = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(postComments)
        .where(eq(postComments.postId, postId));

      const commentCount = commentCountResult[0]?.count || 0;

      // Check if user liked
      let isLiked = false;
      if (currentUser) {
        const userLike = await db
          .select()
          .from(postLikes)
          .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, currentUser.id)))
          .limit(1);
        
        isLiked = userLike.length > 0;
      }

      const post: PostWithUser = {
        id: p.id,
        content: p.content,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        user: {
          id: p.userId,
          username: p.username,
          displayName: p.displayName,
          pfpUrl: p.pfpUrl,
        },
        likeCount,
        commentCount,
        isLiked,
      };

      return res.status(200).json({ post });
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get existing post
      const existing = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const existingPost = existing[0];

      // Only author or admin can update
      if (existingPost.userId !== user.id && !isAdmin(user)) {
        return res.status(403).json({ error: 'Not authorized to update this post' });
      }

      const { content, imageUrl } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      if (content.length > 2000) {
        return res.status(400).json({ error: 'Post too long (max 2000 characters)' });
      }

      const now = new Date();
      await db
        .update(posts)
        .set({
          content: content.trim(),
          imageUrl: imageUrl !== undefined ? (imageUrl || null) : existingPost.imageUrl,
          updatedAt: now,
        })
        .where(eq(posts.id, postId));

      // Get updated post
      const updated = await db
        .select({
          id: posts.id,
          content: posts.content,
          imageUrl: posts.imageUrl,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          userId: posts.userId,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(eq(posts.id, postId))
        .limit(1);

      const p = updated[0];

      const post: PostWithUser = {
        id: p.id,
        content: p.content,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        user: {
          id: p.userId,
          username: p.username,
          displayName: p.displayName,
          pfpUrl: p.pfpUrl,
        },
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
      };

      return res.status(200).json({ success: true, post });
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get existing post
      const existing = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const existingPost = existing[0];

      // Only author or admin can delete
      if (existingPost.userId !== user.id && !isAdmin(user)) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      // Delete likes and comments first
      await db.delete(postLikes).where(eq(postLikes.postId, postId));
      await db.delete(postComments).where(eq(postComments.postId, postId));

      // Delete post
      await db.delete(posts).where(eq(posts.id, postId));

      return res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
