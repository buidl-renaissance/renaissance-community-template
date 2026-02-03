import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/db/drizzle';
import { events, eventRsvps } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from '@/db/user';
import { RsvpStatus, RSVP_STATUSES } from '@/db/schema';

type PostResponseData = {
  success: boolean;
  status: RsvpStatus;
  message: string;
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
  res: NextApiResponse<PostResponseData | DeleteResponseData | ErrorResponse>
) {
  const db = getDb();
  const eventId = req.query.id as string;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  // Verify event exists
  const existingEvent = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (existingEvent.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (req.method === 'POST') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { status } = req.body;

      // Validate status
      if (!status || !RSVP_STATUSES.includes(status as RsvpStatus)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${RSVP_STATUSES.join(', ')}` 
        });
      }

      // Check for existing RSVP
      const existingRsvp = await db
        .select()
        .from(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, eventId),
            eq(eventRsvps.userId, user.id)
          )
        )
        .limit(1);

      if (existingRsvp.length > 0) {
        // Update existing RSVP
        await db
          .update(eventRsvps)
          .set({ status: status as RsvpStatus })
          .where(eq(eventRsvps.id, existingRsvp[0].id));

        return res.status(200).json({
          success: true,
          status: status as RsvpStatus,
          message: `RSVP updated to ${status}`,
        });
      }

      // Create new RSVP
      const newRsvp = {
        id: uuidv4(),
        eventId,
        userId: user.id,
        status: status as RsvpStatus,
      };

      await db.insert(eventRsvps).values(newRsvp);

      return res.status(201).json({
        success: true,
        status: status as RsvpStatus,
        message: `RSVP set to ${status}`,
      });
    } catch (error) {
      console.error('Error setting RSVP:', error);
      return res.status(500).json({ error: 'Failed to set RSVP' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Delete user's RSVP for this event
      await db
        .delete(eventRsvps)
        .where(
          and(
            eq(eventRsvps.eventId, eventId),
            eq(eventRsvps.userId, user.id)
          )
        );

      return res.status(200).json({
        success: true,
        message: 'RSVP cancelled',
      });
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      return res.status(500).json({ error: 'Failed to cancel RSVP' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
