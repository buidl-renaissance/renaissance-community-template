import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { posts, postLikes, postComments, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '@/db/user';

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
  posts: PostWithUser[];
  hasMore: boolean;
};

type PostResponseData = {
  success: boolean;
  post: PostWithUser;
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
  res: NextApiResponse<GetResponseData | PostResponseData | ErrorResponse>
) {
  const db = getDb();

  if (req.method === 'GET') {
    try {
      const currentUser = await getUserFromRequest(req);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

      // Get posts with user info
      const postsWithUsers = await db
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
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1) // Get one extra to check if there's more
        .offset(offset);

      const hasMore = postsWithUsers.length > limit;
      const postsToReturn = hasMore ? postsWithUsers.slice(0, -1) : postsWithUsers;

      // Get like counts
      const likeCounts = await db
        .select({
          postId: postLikes.postId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(postLikes)
        .groupBy(postLikes.postId);

      const likeCountMap = new Map(likeCounts.map(l => [l.postId, l.count]));

      // Get comment counts
      const commentCounts = await db
        .select({
          postId: postComments.postId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(postComments)
        .groupBy(postComments.postId);

      const commentCountMap = new Map(commentCounts.map(c => [c.postId, c.count]));

      // Get user's likes if authenticated
      let userLikesSet = new Set<string>();
      if (currentUser) {
        const userLikes = await db
          .select({ postId: postLikes.postId })
          .from(postLikes)
          .where(eq(postLikes.userId, currentUser.id));
        
        userLikesSet = new Set(userLikes.map(l => l.postId));
      }

      const formattedPosts: PostWithUser[] = postsToReturn.map((p) => ({
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
        likeCount: likeCountMap.get(p.id) || 0,
        commentCount: commentCountMap.get(p.id) || 0,
        isLiked: userLikesSet.has(p.id),
      }));

      return res.status(200).json({ posts: formattedPosts, hasMore });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content, imageUrl } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      if (content.length > 2000) {
        return res.status(400).json({ error: 'Post too long (max 2000 characters)' });
      }

      const newPost = {
        id: uuidv4(),
        userId: user.id,
        content: content.trim(),
        imageUrl: imageUrl || null,
      };

      await db.insert(posts).values(newPost);

      const createdPost: PostWithUser = {
        id: newPost.id,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: user.id,
          username: user.username ?? null,
          displayName: user.displayName ?? null,
          pfpUrl: user.pfpUrl ?? null,
        },
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
      };

      return res.status(201).json({
        success: true,
        post: createdPost,
      });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
