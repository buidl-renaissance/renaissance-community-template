-- Broadcasts table for email blasts
CREATE TABLE IF NOT EXISTS `broadcasts` (
	`id` text PRIMARY KEY NOT NULL,
	`senderId` text NOT NULL,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`recipientCount` integer DEFAULT 0,
	`sentCount` integer DEFAULT 0,
	`failedCount` integer DEFAULT 0,
	`sentAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
