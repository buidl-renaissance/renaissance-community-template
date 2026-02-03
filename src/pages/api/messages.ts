import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { messages, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '@/db/user';

type MessageWithUser = {
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
  messages: MessageWithUser[];
};

type PostResponseData = {
  success: boolean;
  message: MessageWithUser;
};

type ErrorResponse = {
  error: string;
};

// Helper to get user from request (cookie or query param)
async function getUserFromRequest(req: NextApiRequest) {
  // Try query param first
  if (req.query.userId && typeof req.query.userId === 'string') {
    return await getUserById(req.query.userId);
  }

  // Try cookie
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
      // Fetch last 50 messages with user info
      const messagesWithUsers = await db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          userId: messages.userId,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
        })
        .from(messages)
        .leftJoin(users, eq(messages.userId, users.id))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      // Reverse to show oldest first (for chat display)
      const formattedMessages: MessageWithUser[] = messagesWithUsers
        .reverse()
        .map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          user: {
            id: m.userId,
            username: m.username,
            displayName: m.displayName,
            pfpUrl: m.pfpUrl,
          },
        }));

      return res.status(200).json({ messages: formattedMessages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
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
        return res.status(400).json({ error: 'Message content is required' });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: 'Message too long (max 500 characters)' });
      }

      const newMessage = {
        id: uuidv4(),
        userId: user.id,
        content: content.trim(),
      };

      await db.insert(messages).values(newMessage);

      // Return the created message with user info
      const createdMessage: MessageWithUser = {
        id: newMessage.id,
        content: newMessage.content,
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
        message: createdMessage,
      });
    } catch (error) {
      console.error('Error posting message:', error);
      return res.status(500).json({ error: 'Failed to post message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
