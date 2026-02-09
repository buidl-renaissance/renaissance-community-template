DROP INDEX `members_userId_unique`;--> statement-breakpoint
ALTER TABLE `members` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_members_tenant` ON `members` (`tenant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_tenant_user` ON `members` (`tenant_id`,`userId`);--> statement-breakpoint
DROP INDEX `users_phone_unique`;--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_users_tenant` ON `users` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_users_tenant_phone` ON `users` (`tenant_id`,`phone`);--> statement-breakpoint
CREATE INDEX `idx_users_tenant_email` ON `users` (`tenant_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_renaissance_id` ON `users` (`renaissanceId`);--> statement-breakpoint
ALTER TABLE `broadcasts` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_broadcasts_tenant` ON `broadcasts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_broadcasts_tenant_status` ON `broadcasts` (`tenant_id`,`status`);--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_rsvps_tenant` ON `event_rsvps` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_rsvps_event` ON `event_rsvps` (`eventId`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rsvps_event_user` ON `event_rsvps` (`eventId`,`userId`);--> statement-breakpoint
ALTER TABLE `events` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_events_tenant` ON `events` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_events_tenant_date` ON `events` (`tenant_id`,`eventDate`);--> statement-breakpoint
ALTER TABLE `messages` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_messages_tenant` ON `messages` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_tenant_created` ON `messages` (`tenant_id`,`createdAt`);--> statement-breakpoint
ALTER TABLE `post_comments` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_comments_tenant` ON `post_comments` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_comments_post` ON `post_comments` (`postId`);--> statement-breakpoint
ALTER TABLE `post_likes` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_likes_tenant` ON `post_likes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_likes_post` ON `post_likes` (`postId`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_likes_post_user` ON `post_likes` (`postId`,`userId`);--> statement-breakpoint
ALTER TABLE `posts` ADD `tenant_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_posts_tenant` ON `posts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_tenant_created` ON `posts` (`tenant_id`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_posts_user` ON `posts` (`userId`);