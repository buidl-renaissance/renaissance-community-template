import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { events, eventRsvps, users } from '@/db/schema';
import { eq, desc, gte, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById, isOrganizer } from '@/db/user';

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
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
    pfpUrl: string | null;
  };
  rsvpCount: number;
  userRsvpStatus?: string | null;
};

type GetResponseData = {
  events: EventWithCreator[];
};

type PostResponseData = {
  success: boolean;
  event: EventWithCreator;
};

type ErrorResponse = {
  error: string;
};

// Helper to get user from request (cookie or query param)
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
      const showPast = req.query.past === 'true';

      // Build base query
      const now = new Date();
      
      // Get events with creator info
      const baseQuery = db
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
          creatorId: events.creatorId,
          creatorUsername: users.username,
          creatorDisplayName: users.displayName,
          creatorPfpUrl: users.pfpUrl,
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id));

      let eventsList;
      if (showPast) {
        eventsList = await baseQuery.orderBy(desc(events.eventDate));
      } else {
        // Only upcoming events (today or later)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        eventsList = await baseQuery
          .where(gte(events.eventDate, todayStart))
          .orderBy(events.eventDate);
      }

      // Get RSVP counts for all events
      const rsvpCounts = await db
        .select({
          eventId: eventRsvps.eventId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(eventRsvps)
        .where(eq(eventRsvps.status, 'going'))
        .groupBy(eventRsvps.eventId);

      const rsvpCountMap = new Map(rsvpCounts.map(r => [r.eventId, r.count]));

      // Get user's RSVPs if authenticated
      let userRsvpMap = new Map<string, string>();
      if (currentUser) {
        const userRsvps = await db
          .select({
            eventId: eventRsvps.eventId,
            status: eventRsvps.status,
          })
          .from(eventRsvps)
          .where(eq(eventRsvps.userId, currentUser.id));
        
        userRsvpMap = new Map(userRsvps.map(r => [r.eventId, r.status]));
      }

      const formattedEvents: EventWithCreator[] = eventsList.map((e) => ({
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
        creator: {
          id: e.creatorId,
          username: e.creatorUsername,
          displayName: e.creatorDisplayName,
          pfpUrl: e.creatorPfpUrl,
        },
        rsvpCount: rsvpCountMap.get(e.id) || 0,
        userRsvpStatus: userRsvpMap.get(e.id) || null,
      }));

      return res.status(200).json({ events: formattedEvents });
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  if (req.method === 'POST') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Only organizers and admins can create events
      if (!isOrganizer(user)) {
        return res.status(403).json({ error: 'Only organizers can create events' });
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

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Event title is required' });
      }

      if (!eventDate) {
        return res.status(400).json({ error: 'Event date is required' });
      }

      const newEvent = {
        id: uuidv4(),
        creatorId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        imageUrl: imageUrl || null,
        eventDate: new Date(eventDate),
        startTime: startTime || null,
        endTime: endTime || null,
        isExternal: isExternal || false,
        externalUrl: externalUrl?.trim() || null,
      };

      await db.insert(events).values(newEvent);

      const createdEvent: EventWithCreator = {
        ...newEvent,
        createdAt: new Date(),
        creator: {
          id: user.id,
          username: user.username ?? null,
          displayName: user.displayName ?? null,
          pfpUrl: user.pfpUrl ?? null,
        },
        rsvpCount: 0,
        userRsvpStatus: null,
      };

      return res.status(201).json({
        success: true,
        event: createdEvent,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({ error: 'Failed to create event' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
