-- Members table - community membership
CREATE TABLE IF NOT EXISTS `members` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`bio` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `members_userId_unique` ON `members` (`userId`);
--> statement-breakpoint

-- Messages table - community chat
CREATE TABLE IF NOT EXISTS `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint

-- Events table - community events
CREATE TABLE IF NOT EXISTS `events` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`imageUrl` text,
	`eventDate` integer NOT NULL,
	`startTime` text,
	`endTime` text,
	`isExternal` integer DEFAULT false NOT NULL,
	`externalUrl` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS `event_rsvps` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'going' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint

-- Posts table - social feed
CREATE TABLE IF NOT EXISTS `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint

-- Post Likes table
CREATE TABLE IF NOT EXISTS `post_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint

-- Post Comments table
CREATE TABLE IF NOT EXISTS `post_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
