-- Add type and optional eventId to posts (feed item types: event_announcement, intro, rsvp, question, resource, organizer_update)
ALTER TABLE posts ADD COLUMN type TEXT DEFAULT 'post' NOT NULL;
ALTER TABLE posts ADD COLUMN eventId TEXT;
