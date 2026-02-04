import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Default tenant ID for existing data migration
export const DEFAULT_TENANT_ID = 'default';

// User roles
export type UserRole = 'user' | 'organizer' | 'mentor' | 'admin';

// Member profile visibility
export const PROFILE_VISIBILITY = ['public', 'members_only', 'hidden'] as const;
export type ProfileVisibility = typeof PROFILE_VISIBILITY[number];

// User status enum values
export const USER_STATUSES = ['active', 'inactive', 'banned'] as const;
export type UserStatus = typeof USER_STATUSES[number];

// RSVP status enum values
export const RSVP_STATUSES = ['going', 'interested', 'not_going'] as const;
export type RsvpStatus = typeof RSVP_STATUSES[number];

// Users table - tenant-scoped
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  renaissanceId: text('renaissanceId').unique(), // Renaissance app user ID
  phone: text('phone'), // Primary login method (unique within tenant)
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
}, (table) => [
  index('idx_users_tenant').on(table.tenantId),
  index('idx_users_tenant_phone').on(table.tenantId, table.phone),
  index('idx_users_tenant_email').on(table.tenantId, table.email),
  uniqueIndex('idx_users_renaissance_id').on(table.renaissanceId),
]);

// Members table - users who have registered as community members (tenant-scoped)
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  userId: text('userId').notNull(),
  bio: text('bio'), // Optional member bio
  profileVisibility: text('profileVisibility').$type<ProfileVisibility>().default('members_only').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_members_tenant').on(table.tenantId),
  uniqueIndex('idx_members_tenant_user').on(table.tenantId, table.userId),
]);

// Messages table - community chat messages (tenant-scoped)
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_messages_tenant').on(table.tenantId),
  index('idx_messages_tenant_created').on(table.tenantId, table.createdAt),
]);

// Events table - community events (tenant-scoped)
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
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
}, (table) => [
  index('idx_events_tenant').on(table.tenantId),
  index('idx_events_tenant_date').on(table.tenantId, table.eventDate),
]);

// Event RSVPs table - track who's attending events (tenant-scoped)
export const eventRsvps = sqliteTable('event_rsvps', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  eventId: text('eventId').notNull(),
  userId: text('userId').notNull(),
  status: text('status').$type<RsvpStatus>().default('going').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_rsvps_tenant').on(table.tenantId),
  index('idx_rsvps_event').on(table.eventId),
  uniqueIndex('idx_rsvps_event_user').on(table.eventId, table.userId),
]);

// Feed post types (event announcement, intro, rsvp, question, resource, organizer update, or generic post)
export const POST_TYPES = ['post', 'event_announcement', 'intro', 'rsvp', 'question', 'resource', 'organizer_update'] as const;
export type PostType = (typeof POST_TYPES)[number];

// Posts table - social feed posts (tenant-scoped)
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  imageUrl: text('imageUrl'), // Optional image attachment
  type: text('type').$type<PostType>().default('post').notNull(),
  eventId: text('eventId'), // Optional link for event_announcement / rsvp
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_posts_tenant').on(table.tenantId),
  index('idx_posts_tenant_created').on(table.tenantId, table.createdAt),
  index('idx_posts_user').on(table.userId),
]);

// Post Likes table - track likes on posts (tenant-scoped)
export const postLikes = sqliteTable('post_likes', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  postId: text('postId').notNull(),
  userId: text('userId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_likes_tenant').on(table.tenantId),
  index('idx_likes_post').on(table.postId),
  uniqueIndex('idx_likes_post_user').on(table.postId, table.userId),
]);

// Post Comments table - comments on posts (tenant-scoped)
export const postComments = sqliteTable('post_comments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
  postId: text('postId').notNull(),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
}, (table) => [
  index('idx_comments_tenant').on(table.tenantId),
  index('idx_comments_post').on(table.postId),
]);

// Broadcast status enum values
export const BROADCAST_STATUSES = ['draft', 'sending', 'sent', 'failed'] as const;
export type BroadcastStatus = typeof BROADCAST_STATUSES[number];

// Broadcasts table - email blasts sent to members (tenant-scoped)
export const broadcasts = sqliteTable('broadcasts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default(DEFAULT_TENANT_ID),
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
}, (table) => [
  index('idx_broadcasts_tenant').on(table.tenantId),
  index('idx_broadcasts_tenant_status').on(table.tenantId, table.status),
]);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type NewEventRsvp = typeof eventRsvps.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;
export type Broadcast = typeof broadcasts.$inferSelect;
export type NewBroadcast = typeof broadcasts.$inferInsert;
