import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { events, eventRsvps, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserById, isOrganizer, isAdmin } from '@/db/user';

type EventWithCreator = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  eventDate: Date;
  startTime: string | null;
  endTime: string | null;
  isExternal: boolean;
  externalUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
  rsvpCount: number;
  userRsvpStatus?: string | null;
};

type RsvpUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  status: string;
};

type GetResponseData = {
  event: EventWithCreator;
  rsvps: RsvpUser[];
};

type PutResponseData = {
  success: boolean;
  event: EventWithCreator;
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
  const eventId = req.query.id as string;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const currentUser = await getUserFromRequest(req);

      // Get event with creator info
      const eventWithCreator = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          location: events.location,
          imageUrl: events.imageUrl,
          eventDate: events.eventDate,
          startTime: events.startTime,
          endTime: events.endTime,
          isExternal: events.isExternal,
          externalUrl: events.externalUrl,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          creatorId: events.creatorId,
          creatorUsername: users.username,
          creatorDisplayName: users.displayName,
          creatorPfpUrl: users.pfpUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id))
        .where(eq(events.id, eventId))
        .limit(1);

      if (eventWithCreator.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const e = eventWithCreator[0];

      // Get RSVP count
      const rsvpCountResult = await db
        .select({
          count: sql<number>`count(*)`.as('count'),
        })
        .from(eventRsvps)
        .where(eq(eventRsvps.eventId, eventId));

      const rsvpCount = rsvpCountResult[0]?.count || 0;

      // Get user's RSVP status
      let userRsvpStatus: string | null = null;
      if (currentUser) {
        const userRsvp = await db
          .select({ status: eventRsvps.status })
          .from(eventRsvps)
          .where(eq(eventRsvps.eventId, eventId))
          .where(eq(eventRsvps.userId, currentUser.id))
          .limit(1);
        
        userRsvpStatus = userRsvp[0]?.status || null;
      }

      // Get all RSVPs with user info
      const rsvpsWithUsers = await db
        .select({
          rsvpId: eventRsvps.id,
          status: eventRsvps.status,
          userId: eventRsvps.userId,
          username: users.username,
          displayName: users.displayName,
          pfpUrl: users.pfpUrl,
        })
        .from(eventRsvps)
        .leftJoin(users, eq(eventRsvps.userId, users.id))
        .where(eq(eventRsvps.eventId, eventId));

      const rsvps: RsvpUser[] = rsvpsWithUsers.map((r) => ({
        id: r.userId,
        username: r.username,
        displayName: r.displayName,
        pfpUrl: r.pfpUrl,
        status: r.status,
      }));

      const event: EventWithCreator = {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        imageUrl: e.imageUrl,
        eventDate: e.eventDate,
        startTime: e.startTime,
        endTime: e.endTime,
        isExternal: e.isExternal,
        externalUrl: e.externalUrl,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        creator: {
          id: e.creatorId,
          username: e.creatorUsername,
          displayName: e.creatorDisplayName,
          pfpUrl: e.creatorPfpUrl,
        },
        rsvpCount,
        userRsvpStatus,
      };

      return res.status(200).json({ event, rsvps });
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get existing event
      const existing = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const existingEvent = existing[0];

      // Only creator or admin can update
      if (existingEvent.creatorId !== user.id && !isAdmin(user)) {
        return res.status(403).json({ error: 'Not authorized to update this event' });
      }

      const {
        title,
        description,
        location,
        imageUrl,
        eventDate,
        startTime,
        endTime,
        isExternal,
        externalUrl,
      } = req.body;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (location !== undefined) updateData.location = location?.trim() || null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
      if (startTime !== undefined) updateData.startTime = startTime || null;
      if (endTime !== undefined) updateData.endTime = endTime || null;
      if (isExternal !== undefined) updateData.isExternal = isExternal;
      if (externalUrl !== undefined) updateData.externalUrl = externalUrl?.trim() || null;

      await db.update(events).set(updateData).where(eq(events.id, eventId));

      // Get updated event
      const updated = await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          location: events.location,
          imageUrl: events.imageUrl,
          eventDate: events.eventDate,
          startTime: events.startTime,
          endTime: events.endTime,
          isExternal: events.isExternal,
          externalUrl: events.externalUrl,
          createdAt: events.createdAt,
          updatedAt: events.updatedAt,
          creatorId: events.creatorId,
          creatorUsername: users.username,
          creatorDisplayName: users.displayName,
          creatorPfpUrl: users.pfpUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id))
        .where(eq(events.id, eventId))
        .limit(1);

      const e = updated[0];

      const event: EventWithCreator = {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        imageUrl: e.imageUrl,
        eventDate: e.eventDate,
        startTime: e.startTime,
        endTime: e.endTime,
        isExternal: e.isExternal,
        externalUrl: e.externalUrl,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        creator: {
          id: e.creatorId,
          username: e.creatorUsername,
          displayName: e.creatorDisplayName,
          pfpUrl: e.creatorPfpUrl,
        },
        rsvpCount: 0,
        userRsvpStatus: null,
      };

      return res.status(200).json({ success: true, event });
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(500).json({ error: 'Failed to update event' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get existing event
      const existing = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const existingEvent = existing[0];

      // Only creator or admin can delete
      if (existingEvent.creatorId !== user.id && !isAdmin(user)) {
        return res.status(403).json({ error: 'Not authorized to delete this event' });
      }

      // Delete RSVPs first
      await db.delete(eventRsvps).where(eq(eventRsvps.eventId, eventId));

      // Delete event
      await db.delete(events).where(eq(events.id, eventId));

      return res.status(200).json({ success: true, message: 'Event deleted' });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
