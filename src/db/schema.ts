import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User roles
export type UserRole = 'user' | 'organizer' | 'admin';

// User status enum values
export const USER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// RSVP status enum values
export const RSVP_STATUSES = ['going', 'interested', 'not_going'] as const;
export type RsvpStatus = typeof RSVP_STATUSES[number];

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  renaissanceId: text('renaissanceId').unique(), // Renaissance app user ID
  phone: text('phone').unique(), // Primary login method
  email: text('email'), // Optional
  username: text('username'),
  name: text('name'), // Display name
  pfpUrl: text('pfpUrl'), // Profile picture URL
  displayName: text('displayName'), // App-specific name (editable)
  profilePicture: text('profilePicture'), // App-specific profile picture (editable)
  accountAddress: text('accountAddress'), // Wallet address
  pinHash: text('pinHash'), // bcrypt hash of 4-digit PIN
  failedPinAttempts: integer('failedPinAttempts').default(0), // Failed PIN attempts counter
  lockedAt: integer('lockedAt', { mode: 'timestamp' }), // Timestamp when account was locked
  status: text('status').$type<UserStatus>().default('active'), // User status: active, inactive, banned
  role: text('role').$type<UserRole>().default('user').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Members table - users who have registered as community members
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  bio: text('bio'), // Optional member bio
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Messages table - community chat messages
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Events table - community events (internal or external)
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  creatorId: text('creatorId').notNull(), // User who created the event
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  imageUrl: text('imageUrl'),
  eventDate: integer('eventDate', { mode: 'timestamp' }).notNull(),
  startTime: text('startTime'), // HH:MM format
  endTime: text('endTime'), // HH:MM format
  isExternal: integer('isExternal', { mode: 'boolean' }).default(false).notNull(), // External API event
  externalUrl: text('externalUrl'), // Link to external event page
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Event RSVPs table - track who's attending events
export const eventRsvps = sqliteTable('event_rsvps', {
  id: text('id').primaryKey(),
  eventId: text('eventId').notNull(),
  userId: text('userId').notNull(),
  status: text('status').$type<RsvpStatus>().default('going').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Posts table - social feed posts
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'), // Optional image attachment
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Post Likes table - track likes on posts
export const postLikes = sqliteTable('post_likes', {
  id: text('id').primaryKey(),
  postId: text('postId').notNull(),
  userId: text('userId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Post Comments table - comments on posts
export const postComments = sqliteTable('post_comments', {
  id: text('id').primaryKey(),
  postId: text('postId').notNull(),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Broadcast status enum values
export const BROADCAST_STATUSES = ['draft', 'sending', 'sent', 'failed'] as const;
export type BroadcastStatus = typeof BROADCAST_STATUSES[number];

// Broadcasts table - email blasts sent to members
export const broadcasts = sqliteTable('broadcasts', {
  id: text('id').primaryKey(),
  senderId: text('senderId').notNull(), // Admin who sent the broadcast
  subject: text('subject').notNull(),
  content: text('content').notNull(), // HTML content
  status: text('status').$type<BroadcastStatus>().default('draft').notNull(),
  recipientCount: integer('recipientCount').default(0), // Number of recipients
  sentCount: integer('sentCount').default(0), // Number of emails actually sent
  failedCount: integer('failedCount').default(0), // Number of failed sends
  sentAt: integer('sentAt', { mode: 'timestamp' }), // When broadcast was sent
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});
