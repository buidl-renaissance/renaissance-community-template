-- Add profileVisibility to members table (default: members_only for safety)
ALTER TABLE members ADD COLUMN profileVisibility TEXT DEFAULT 'members_only' NOT NULL;
