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
