import { eq } from "drizzle-orm";
import { songs, sections } from "../../database/schema";
import type { DB } from "./db";

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

export class SongRepository {
  constructor(private db: DB) {}

  async getAllSongs(): Promise<Song[]> {
    return this.db.select().from(songs);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    const result = await this.db.select().from(songs).where(eq(songs.id, id));
    return result[0];
  }

  async createSong(song: Omit<NewSong, "createdAt" | "updatedAt">): Promise<Song> {
    const now = Date.now();
    const newSong = {
      ...song,
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.insert(songs).values(newSong);
    return this.getSongById(song.id) as Promise<Song>;
  }

  async updateSong(id: string, updates: Partial<Omit<Song, "id" | "createdAt">>): Promise<Song | undefined> {
    const now = Date.now();
    await this.db
      .update(songs)
      .set({ ...updates, updatedAt: now })
      .where(eq(songs.id, id));
    
    return this.getSongById(id);
  }

  async deleteSong(id: string): Promise<void> {
    await this.db.delete(songs).where(eq(songs.id, id));
  }

  async getSongSections(songId: string): Promise<Section[]> {
    return this.db
      .select()
      .from(sections)
      .where(eq(sections.songId, songId))
      .orderBy(sections.order);
  }

  async createSection(section: Omit<NewSection, "createdAt" | "updatedAt">): Promise<Section> {
    const now = Date.now();
    const newSection = {
      ...section,
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.insert(sections).values(newSection);
    return this.getSectionById(section.id) as Promise<Section>;
  }

  async getSectionById(id: string): Promise<Section | undefined> {
    const result = await this.db.select().from(sections).where(eq(sections.id, id));
    return result[0];
  }

  async updateSection(id: string, updates: Partial<Omit<Section, "id" | "createdAt">>): Promise<Section | undefined> {
    const now = Date.now();
    await this.db
      .update(sections)
      .set({ ...updates, updatedAt: now })
      .where(eq(sections.id, id));
    
    return this.getSectionById(id);
  }

  async deleteSection(id: string): Promise<void> {
    await this.db.delete(sections).where(eq(sections.id, id));
  }

  async reorderSections(songId: string, sectionIds: string[]): Promise<void> {
    for (let i = 0; i < sectionIds.length; i++) {
      await this.updateSection(sectionIds[i], { order: i + 1 });
    }
  }

  async bulkUpdateSectionTempo(updates: Array<{ sectionId: string; tempo: number }>): Promise<void> {
    const now = Date.now();
    
    for (const update of updates) {
      await this.db
        .update(sections)
        .set({ tempo: update.tempo, updatedAt: now })
        .where(eq(sections.id, update.sectionId));
    }
  }

  async saveTempoBulkAdjustment(songId: string, adjustmentData: {
    scaling: number;
    excludedSectionIds: string[];
    originalTempos: Record<string, number>;
    newTempos: Record<string, number>;
  }): Promise<void> {
    // テンポ調整履歴をメタデータとして保存（将来的な拡張用）
    const metadata = {
      lastTempoAdjustment: {
        timestamp: Date.now(),
        scaling: adjustmentData.scaling,
        excludedSectionIds: adjustmentData.excludedSectionIds,
        changes: Object.entries(adjustmentData.newTempos).map(([sectionId, newTempo]) => ({
          sectionId,
          originalTempo: adjustmentData.originalTempos[sectionId],
          newTempo
        }))
      }
    };

    await this.updateSong(songId, {
      // メタデータをJSONとして保存する場合の拡張可能フィールド
      updatedAt: Date.now()
    });
  }
}