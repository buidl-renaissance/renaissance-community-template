import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { members, users } from '@/db/schema';
import { eq, desc, like, or } from 'drizzle-orm';

type MemberWithUser = {
  id: string;
  userId: string;
  bio: string | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  createdAt: Date;
};

type GetResponseData = {
  members: MemberWithUser[];
  total: number;
  page: number;
  pageSize: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponseData | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  try {
    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * pageSize;

    // Build query
    let query = db
      .select({
        id: members.id,
        userId: members.userId,
        bio: members.bio,
        username: users.username,
        displayName: users.displayName,
        pfpUrl: users.pfpUrl,
        createdAt: members.createdAt,
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .orderBy(desc(members.createdAt));

    // Get total count
    const allMembers = await db.select().from(members);
    const total = allMembers.length;

    // Apply search filter if provided
    let membersList;
    if (search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      membersList = await query
        .where(
          or(
            like(users.username, searchPattern),
            like(users.displayName, searchPattern)
          )
        )
        .limit(pageSize)
        .offset(offset);
    } else {
      membersList = await query.limit(pageSize).offset(offset);
    }

    const formattedMembers: MemberWithUser[] = membersList.map((m) => ({
      id: m.id,
      userId: m.userId,
      bio: m.bio,
      username: m.username,
      displayName: m.displayName,
      pfpUrl: m.pfpUrl,
      createdAt: m.createdAt,
    }));

    return res.status(200).json({
      members: formattedMembers,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching members list:', error);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
}
