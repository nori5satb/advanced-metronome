CREATE TABLE `deviceRegistrations` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`deviceId` text NOT NULL,
	`deviceName` text NOT NULL,
	`deviceType` text,
	`lastSyncAt` integer,
	`isActive` integer DEFAULT 1 NOT NULL,
	`syncVersion` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deviceRegistrations_deviceId_unique` ON `deviceRegistrations` (`deviceId`);--> statement-breakpoint
CREATE TABLE `emailVerificationTokens` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`isUsed` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emailVerificationTokens_token_unique` ON `emailVerificationTokens` (`token`);--> statement-breakpoint
CREATE TABLE `oauthAccounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` integer,
	`tokenType` text,
	`scope` text,
	`idToken` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`isUsed` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passwordResetTokens_token_unique` ON `passwordResetTokens` (`token`);--> statement-breakpoint
CREATE TABLE `syncConflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`localData` text NOT NULL,
	`remoteData` text NOT NULL,
	`conflictType` text NOT NULL,
	`resolution` text,
	`resolvedData` text,
	`isResolved` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`resolvedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `syncData` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`action` text NOT NULL,
	`data` text,
	`timestamp` integer NOT NULL,
	`deviceId` text,
	`isProcessed` integer DEFAULT 0 NOT NULL,
	`conflictResolved` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionToken` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`isActive` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userSessions_sessionToken_unique` ON `userSessions` (`sessionToken`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`passwordHash` text,
	`emailVerified` integer DEFAULT 0 NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`lastLoginAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `practiceSessions` ADD `userId` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `songs` ADD `userId` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `songs` ADD `isPublic` integer DEFAULT 0 NOT NULL;