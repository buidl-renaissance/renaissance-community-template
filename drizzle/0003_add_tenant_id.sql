-- Migration: Add tenant_id to all tables for multi-tenancy support
-- This migration is backwards-compatible: all existing data gets DEFAULT_TENANT_ID

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_phone ON users(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- Add tenant_id to members table
ALTER TABLE members ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_members_tenant ON members(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_tenant_user ON members(tenant_id, userId);

-- Add tenant_id to messages table
ALTER TABLE messages ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created ON messages(tenant_id, createdAt);

-- Add tenant_id to events table
ALTER TABLE events ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant_date ON events(tenant_id, eventDate);

-- Add tenant_id to event_rsvps table
ALTER TABLE event_rsvps ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_rsvps_tenant ON event_rsvps(tenant_id);

-- Add tenant_id to posts table
ALTER TABLE posts ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_posts_tenant ON posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_posts_tenant_created ON posts(tenant_id, createdAt);

-- Add tenant_id to post_likes table
ALTER TABLE post_likes ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_likes_tenant ON post_likes(tenant_id);

-- Add tenant_id to post_comments table
ALTER TABLE post_comments ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_comments_tenant ON post_comments(tenant_id);

-- Add tenant_id to broadcasts table
ALTER TABLE broadcasts ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_broadcasts_tenant ON broadcasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_tenant_status ON broadcasts(tenant_id, status);
