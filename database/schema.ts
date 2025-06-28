import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const guestBook = sqliteTable("guestBook", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
});

export const songs = sqliteTable("songs", {
  id: text().primaryKey(),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  title: text().notNull(),
  artist: text(),
  genre: text(),
  defaultTempo: integer(),
  defaultTimeSignature: text(),
  isPublic: integer().notNull().default(0), // boolean as integer
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const sections = sqliteTable("sections", {
  id: text().primaryKey(),
  songId: text().notNull().references(() => songs.id, { onDelete: "cascade" }),
  name: text().notNull(),
  tempo: integer().notNull(),
  timeSignature: text().notNull(),
  measures: integer().notNull().default(4),
  order: integer().notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const practiceSessions = sqliteTable("practiceSessions", {
  id: text().primaryKey(),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  songId: text().references(() => songs.id, { onDelete: "cascade" }),
  name: text().notNull(),
  startMeasure: integer().notNull().default(1),
  endMeasure: integer(),
  sectionIds: text(), // JSON array of section IDs
  loopEnabled: integer().notNull().default(0), // boolean as integer
  loopCount: integer().default(0),
  targetLoops: integer(),
  tempo: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const practiceHistory = sqliteTable("practiceHistory", {
  id: text().primaryKey(),
  sessionId: text().notNull().references(() => practiceSessions.id, { onDelete: "cascade" }),
  songId: text().references(() => songs.id, { onDelete: "cascade" }),
  practiceDate: integer().notNull(), // timestamp
  duration: integer().notNull(), // seconds
  completedLoops: integer().notNull().default(0),
  targetLoops: integer(),
  tempo: integer().notNull(),
  accuracy: real(), // percentage (0-100)
  notes: text(),
  createdAt: integer().notNull(),
});

export const users = sqliteTable("users", {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text(), // nullable for OAuth users
  emailVerified: integer().notNull().default(0), // boolean as integer
  isActive: integer().notNull().default(1), // boolean as integer
  lastLoginAt: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const userSessions = sqliteTable("userSessions", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text().notNull().unique(),
  expiresAt: integer().notNull(),
  ipAddress: text(),
  userAgent: text(),
  isActive: integer().notNull().default(1), // boolean as integer
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const oauthAccounts = sqliteTable("oauthAccounts", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text().notNull(), // "google", "apple", etc.
  providerAccountId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  expiresAt: integer(),
  tokenType: text(),
  scope: text(),
  idToken: text(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const passwordResetTokens = sqliteTable("passwordResetTokens", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text().notNull().unique(),
  expiresAt: integer().notNull(),
  isUsed: integer().notNull().default(0), // boolean as integer
  createdAt: integer().notNull(),
});

export const emailVerificationTokens = sqliteTable("emailVerificationTokens", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text().notNull().unique(),
  expiresAt: integer().notNull(),
  isUsed: integer().notNull().default(0), // boolean as integer
  createdAt: integer().notNull(),
});

export const syncData = sqliteTable("syncData", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: text().notNull(), // "song", "section", "practiceSession", etc.
  entityId: text().notNull(),
  action: text().notNull(), // "create", "update", "delete"
  data: text(), // JSON data of the entity
  timestamp: integer().notNull(),
  deviceId: text(),
  isProcessed: integer().notNull().default(0), // boolean as integer
  conflictResolved: integer().notNull().default(0), // boolean as integer
  createdAt: integer().notNull(),
});

export const deviceRegistrations = sqliteTable("deviceRegistrations", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: text().notNull().unique(),
  deviceName: text().notNull(),
  deviceType: text(), // "mobile", "desktop", "tablet"
  lastSyncAt: integer(),
  isActive: integer().notNull().default(1), // boolean as integer
  syncVersion: integer().notNull().default(1),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const syncConflicts = sqliteTable("syncConflicts", {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: text().notNull(),
  entityId: text().notNull(),
  localData: text().notNull(), // JSON
  remoteData: text().notNull(), // JSON
  conflictType: text().notNull(), // "update_conflict", "delete_conflict"
  resolution: text(), // "local", "remote", "merge", "manual"
  resolvedData: text(), // JSON of resolved data
  isResolved: integer().notNull().default(0), // boolean as integer
  createdAt: integer().notNull(),
  resolvedAt: integer(),
});
