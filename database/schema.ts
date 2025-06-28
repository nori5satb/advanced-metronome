import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const guestBook = sqliteTable("guestBook", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
});

export const songs = sqliteTable("songs", {
  id: text().primaryKey(),
  title: text().notNull(),
  artist: text(),
  genre: text(),
  defaultTempo: integer(),
  defaultTimeSignature: text(),
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
