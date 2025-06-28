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

export const sheetMusic = sqliteTable("sheetMusic", {
  id: text().primaryKey(),
  songId: text().references(() => songs.id, { onDelete: "cascade" }),
  userId: text().references(() => users.id, { onDelete: "cascade" }),
  fileName: text().notNull(),
  filePath: text().notNull(),
  fileSize: integer().notNull(),
  mimeType: text().notNull(),
  isProcessed: integer().notNull().default(0), // boolean as integer
  uploadedAt: integer().notNull(),
  processedAt: integer(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const sheetMusicAnalysis = sqliteTable("sheetMusicAnalysis", {
  id: text().primaryKey(),
  sheetMusicId: text().notNull().references(() => sheetMusic.id, { onDelete: "cascade" }),
  analysisVersion: text().notNull().default("1.0"),
  detectedTempo: integer(),
  tempoConfidence: real(), // 0-1
  detectedTimeSignature: text(),
  timeSignatureConfidence: real(), // 0-1
  detectedKey: text(),
  keyConfidence: real(), // 0-1
  totalMeasures: integer(),
  totalPages: integer(),
  rawOcrData: text(), // JSON
  analysisMetadata: text(), // JSON
  processingTimeMs: integer(),
  errorMessages: text(), // JSON array
  confidenceScore: real(), // overall confidence 0-1
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
});

export const sheetMusicSections = sqliteTable("sheetMusicSections", {
  id: text().primaryKey(),
  analysisId: text().notNull().references(() => sheetMusicAnalysis.id, { onDelete: "cascade" }),
  sectionType: text().notNull(), // "verse", "chorus", "bridge", "intro", "outro", "instrumental"
  startMeasure: integer().notNull(),
  endMeasure: integer().notNull(),
  startPage: integer(),
  endPage: integer(),
  coordinateData: text(), // JSON with bounding boxes
  tempo: integer(),
  timeSignature: text(),
  confidence: real(), // 0-1
  notes: text(),
  createdAt: integer().notNull(),
});

export const sheetMusicElements = sqliteTable("sheetMusicElements", {
  id: text().primaryKey(),
  analysisId: text().notNull().references(() => sheetMusicAnalysis.id, { onDelete: "cascade" }),
  elementType: text().notNull(), // "tempo_marking", "time_signature", "key_signature", "measure_line", "note", "rest"
  page: integer().notNull(),
  boundingBox: text().notNull(), // JSON: {x, y, width, height}
  value: text(), // recognized value (e.g., "120", "4/4", "C major")
  confidence: real().notNull(), // 0-1
  rawData: text(), // JSON with additional metadata
  measure: integer(),
  staff: integer(),
  createdAt: integer().notNull(),
});
