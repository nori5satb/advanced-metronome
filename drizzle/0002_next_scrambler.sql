CREATE TABLE `practiceHistory` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`songId` text,
	`practiceDate` integer NOT NULL,
	`duration` integer NOT NULL,
	`completedLoops` integer DEFAULT 0 NOT NULL,
	`targetLoops` integer,
	`tempo` integer NOT NULL,
	`accuracy` real,
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `practiceSessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `practiceSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`songId` text,
	`name` text NOT NULL,
	`startMeasure` integer DEFAULT 1 NOT NULL,
	`endMeasure` integer,
	`sectionIds` text,
	`loopEnabled` integer DEFAULT 0 NOT NULL,
	`loopCount` integer DEFAULT 0,
	`targetLoops` integer,
	`tempo` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
