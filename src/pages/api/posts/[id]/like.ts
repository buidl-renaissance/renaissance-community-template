import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { posts, postLikes } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '@/db/user';

type PostResponseData = {
  success: boolean;
  liked: boolean;
  likeCount: number;
};

type DeleteResponseData = {
  success: boolean;
  liked: boolean;
  likeCount: number;
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

async function getLikeCount(db: ReturnType<typeof getDb>, postId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(postLikes)
    .where(eq(postLikes.postId, postId));
  
  return result[0]?.count || 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponseData | DeleteResponseData | ErrorResponse>
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

  if (req.method === 'POST') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if already liked
      const existingLike = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, user.id)
          )
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Already liked, return current state
        const likeCount = await getLikeCount(db, postId);
        return res.status(200).json({
          success: true,
          liked: true,
          likeCount,
        });
      }

      // Create new like
      const newLike = {
        id: uuidv4(),
        postId,
        userId: user.id,
      };

      await db.insert(postLikes).values(newLike);

      const likeCount = await getLikeCount(db, postId);

      return res.status(201).json({
        success: true,
        liked: true,
        likeCount,
      });
    } catch (error) {
      console.error('Error liking post:', error);
      return res.status(500).json({ error: 'Failed to like post' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Delete user's like
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, user.id)
          )
        );

      const likeCount = await getLikeCount(db, postId);

      return res.status(200).json({
        success: true,
        liked: false,
        likeCount,
      });
    } catch (error) {
      console.error('Error unliking post:', error);
      return res.status(500).json({ error: 'Failed to unlike post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
