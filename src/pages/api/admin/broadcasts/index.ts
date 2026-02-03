import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { broadcasts, members, users } from '@/db/schema';
import { getUserById } from '@/db/user';
import { sendBroadcastEmail, generateEmailTemplate } from '@/lib/email';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Admin broadcasts API
 * 
 * GET /api/admin/broadcasts - List all broadcasts
 * POST /api/admin/broadcasts - Create and send a new broadcast
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get user from cookie or query (for dev)
  const userId = req.cookies.user_session || req.query.userId as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await getUserById(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admins can access broadcasts
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Get all broadcasts, most recent first
      const allBroadcasts = await db
        .select({
          id: broadcasts.id,
          subject: broadcasts.subject,
          status: broadcasts.status,
          recipientCount: broadcasts.recipientCount,
          sentCount: broadcasts.sentCount,
          failedCount: broadcasts.failedCount,
          sentAt: broadcasts.sentAt,
          createdAt: broadcasts.createdAt,
        })
        .from(broadcasts)
        .orderBy(desc(broadcasts.createdAt))
        .limit(50);

      return res.status(200).json({ broadcasts: allBroadcasts });
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      return res.status(500).json({ error: 'Failed to fetch broadcasts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { subject, content, sendNow = true } = req.body;

      if (!subject || !content) {
        return res.status(400).json({ error: 'Subject and content are required' });
      }

      // Get all members with email addresses
      const memberRecipients = await db
        .select({
          email: users.email,
          displayName: users.displayName,
          username: users.username,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(isNotNull(users.email));

      const recipients = memberRecipients
        .filter(r => r.email)
        .map(r => ({
          email: r.email!,
          name: r.displayName || r.username || undefined,
        }));

      // Create broadcast record
      const broadcastId = uuidv4();
      await db.insert(broadcasts).values({
        id: broadcastId,
        senderId: user.id,
        subject,
        content,
        status: sendNow ? 'sending' : 'draft',
        recipientCount: recipients.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (!sendNow) {
        return res.status(200).json({
          success: true,
          broadcastId,
          message: 'Broadcast saved as draft',
        });
      }

      // Generate HTML email
      const html = generateEmailTemplate({
        title: subject,
        content: content,
        preheader: subject,
      });

      // Send the broadcast
      const result = await sendBroadcastEmail({
        recipients,
        subject,
        html,
      });

      // Update broadcast record with results
      await db
        .update(broadcasts)
        .set({
          status: result.failed > 0 && result.sent === 0 ? 'failed' : 'sent',
          sentCount: result.sent,
          failedCount: result.failed,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(broadcasts.id, broadcastId));

      console.log(`✅ [BROADCAST] Completed: ${result.sent}/${result.total} sent`);

      return res.status(200).json({
        success: true,
        broadcastId,
        total: result.total,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (error) {
      console.error('Error creating broadcast:', error);
      return res.status(500).json({ error: 'Failed to create broadcast' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
