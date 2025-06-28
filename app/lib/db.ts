import { drizzle } from "drizzle-orm/d1";
import { songs, sections } from "../../database/schema";

export function createDB(db: D1Database) {
  return drizzle(db, { schema: { songs, sections } });
}

export type DB = ReturnType<typeof createDB>;