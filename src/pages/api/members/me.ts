import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserById } from '@/db/user';
import { PROFILE_VISIBILITY } from '@/db/schema';

type ErrorResponse = { error: string };

async function getUserFromRequest(req: NextApiRequest) {
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  if (sessionMatch?.[1]) {
    return await getUserById(sessionMatch[1]);
  }
  return null;
}

type GetResponse = { profileVisibility: string } | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | GetResponse | ErrorResponse>
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const db = getDb();
  const existing = await db
    .select({ id: members.id, profileVisibility: members.profileVisibility })
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);
  if (existing.length === 0) {
    return res.status(404).json({ error: 'Not a member' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      profileVisibility: existing[0].profileVisibility ?? 'members_only',
    });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { profileVisibility } = req.body as { profileVisibility?: string };
  if (!profileVisibility || !PROFILE_VISIBILITY.includes(profileVisibility as (typeof PROFILE_VISIBILITY)[number])) {
    return res.status(400).json({ error: 'Valid profileVisibility required: public, members_only, or hidden' });
  }

  await db
    .update(members)
    .set({ profileVisibility: profileVisibility as (typeof PROFILE_VISIBILITY)[number] })
    .where(eq(members.userId, user.id));

  return res.status(200).json({ success: true });
}
