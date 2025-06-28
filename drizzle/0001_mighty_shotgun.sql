CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`songId` text NOT NULL,
	`name` text NOT NULL,
	`tempo` integer NOT NULL,
	`timeSignature` text NOT NULL,
	`measures` integer DEFAULT 4 NOT NULL,
	`order` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`genre` text,
	`defaultTempo` integer,
	`defaultTimeSignature` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
