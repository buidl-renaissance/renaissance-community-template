import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { members, users, eventRsvps, posts } from '@/db/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';
import { getUserById } from '@/db/user';
import { communityConfig } from '@/config/community';

type MemberWithUser = {
  id: string;
  userId: string;
  bio: string | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  role: string;
  profileVisibility: string;
  eventCount: number;
  postCount: number;
  createdAt: Date;
};

type GetResponseData = {
  members: MemberWithUser[];
  total: number;
  page: number;
  pageSize: number;
  canView: boolean;
};

type ErrorResponse = {
  error: string;
};

async function getUserFromRequest(req: NextApiRequest) {
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  if (sessionMatch?.[1]) {
    return await getUserById(sessionMatch[1]);
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponseData | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  try {
    const currentUser = await getUserFromRequest(req);

    // Directory visibility: if not public, only members can view
    if (!communityConfig.features.memberDirectoryPublic) {
      const isMember = currentUser
        ? (await db.select().from(members).where(eq(members.userId, currentUser.id))).length > 0
        : false;
      if (!isMember) {
        return res.status(200).json({
          members: [],
          total: 0,
          page: 1,
          pageSize: 20,
          canView: false,
        });
      }
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * pageSize;

    let query = db
      .select({
        id: members.id,
        userId: members.userId,
        bio: members.bio,
        profileVisibility: members.profileVisibility,
        username: users.username,
        displayName: users.displayName,
        pfpUrl: users.pfpUrl,
        role: users.role,
        createdAt: members.createdAt,
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .orderBy(desc(members.createdAt));

    let membersList: Awaited<ReturnType<typeof query.limit>>;
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

    // Filter by profile visibility: hide 'hidden'; for 'members_only' require viewer to be a member
    const isViewerMember = currentUser
      ? (await db.select().from(members).where(eq(members.userId, currentUser.id))).length > 0
      : false;

    const filtered = membersList.filter((m) => {
      if (m.profileVisibility === 'hidden') return false;
      if (m.profileVisibility === 'members_only' && !isViewerMember) return false;
      return true;
    });

    // Get event counts (RSVPs with status 'going') and post counts per userId
    const userIds = filtered.map((m) => m.userId);
    const eventCounts = await db
      .select({
        userId: eventRsvps.userId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.status, 'going')))
      .groupBy(eventRsvps.userId);
    const postCounts = await db
      .select({
        userId: posts.userId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(posts)
      .groupBy(posts.userId);

    const eventCountMap = new Map(eventCounts.map((r) => [r.userId, Number(r.count)]));
    const postCountMap = new Map(postCounts.map((r) => [r.userId, Number(r.count)]));

    const formattedMembers: MemberWithUser[] = filtered.map((m) => ({
      id: m.id,
      userId: m.userId,
      bio: m.bio,
      username: m.username,
      displayName: m.displayName,
      pfpUrl: m.pfpUrl,
      role: m.role ?? 'user',
      profileVisibility: m.profileVisibility ?? 'members_only',
      eventCount: eventCountMap.get(m.userId) ?? 0,
      postCount: postCountMap.get(m.userId) ?? 0,
      createdAt: m.createdAt,
    }));

    const allMembers = await db.select({ id: members.id, profileVisibility: members.profileVisibility }).from(members);
    const totalFiltered = allMembers.filter((m) => {
      if (m.profileVisibility === 'hidden') return false;
      if (m.profileVisibility === 'members_only' && !isViewerMember) return false;
      return true;
    }).length;

    return res.status(200).json({
      members: formattedMembers,
      total: totalFiltered,
      page,
      pageSize,
      canView: true,
    });
  } catch (error) {
    console.error('Error fetching members list:', error);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
}
