import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { posts, postComments, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '@/db/user';

type CommentWithUser = {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
};

type GetResponseData = {
  comments: CommentWithUser[];
};

type PostResponseData = {
  success: boolean;
  comment: CommentWithUser;
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
  const postId = req.query.id as string;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  // Verify post exists
  const existingPost = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (existingPost.length === 0) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (req.method === 'GET') {
    try {
      // Get comments with user info
      const commentsWithUsers = await db
        .select({
          id: postComments.id,
          content: postComments.content,
          createdAt: postComments.createdAt,
          userId: postComments.userId,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
        })
        .from(postComments)
        .leftJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, postId))
        .orderBy(postComments.createdAt); // Oldest first

      const comments: CommentWithUser[] = commentsWithUsers.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.userId,
          username: c.username,
          displayName: c.displayName,
          pfpUrl: c.pfpUrl,
        },
      }));

      return res.status(200).json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: 'Comment too long (max 500 characters)' });
      }

      const newComment = {
        id: uuidv4(),
        postId,
        userId: user.id,
        content: content.trim(),
      };

      await db.insert(postComments).values(newComment);

      const comment: CommentWithUser = {
        id: newComment.id,
        content: newComment.content,
        createdAt: new Date(),
        user: {
          id: user.id,
          username: user.username ?? null,
          displayName: user.displayName ?? null,
          pfpUrl: user.pfpUrl ?? null,
        },
      };

      return res.status(201).json({
        success: true,
        comment,
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
