import { eq, and } from "drizzle-orm";
import { practiceSessions, practiceHistory } from "../../database/schema";
import type { DB } from "./db";
import type { Section } from "./songs";

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type PracticeHistoryRecord = typeof practiceHistory.$inferSelect;
export type NewPracticeHistoryRecord = typeof practiceHistory.$inferInsert;

export interface PracticeRange {
  startMeasure: number;
  endMeasure?: number;
  sections?: Section[];
}

export interface LoopSettings {
  enabled: boolean;
  targetLoops?: number;
  currentLoop: number;
}

export interface PracticeProgress {
  currentMeasure: number;
  currentLoop: number;
  totalLoops: number;
  isComplete: boolean;
  elapsedTime: number;
}

export class PracticeSessionRepository {
  constructor(private db: DB) {}

  async getAllSessions(): Promise<PracticeSession[]> {
    return this.db.select().from(practiceSessions);
  }

  async getSessionById(id: string): Promise<PracticeSession | undefined> {
    const result = await this.db.select().from(practiceSessions).where(eq(practiceSessions.id, id));
    return result[0];
  }

  async getSessionsBySong(songId: string): Promise<PracticeSession[]> {
    return this.db.select().from(practiceSessions).where(eq(practiceSessions.songId, songId));
  }

  async createSession(session: Omit<NewPracticeSession, "createdAt" | "updatedAt">): Promise<PracticeSession> {
    const now = Date.now();
    const newSession = {
      ...session,
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.insert(practiceSessions).values(newSession);
    return this.getSessionById(session.id) as Promise<PracticeSession>;
  }

  async updateSession(id: string, updates: Partial<Omit<PracticeSession, "id" | "createdAt">>): Promise<PracticeSession | undefined> {
    const now = Date.now();
    await this.db
      .update(practiceSessions)
      .set({ ...updates, updatedAt: now })
      .where(eq(practiceSessions.id, id));
    
    return this.getSessionById(id);
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.delete(practiceSessions).where(eq(practiceSessions.id, id));
  }

  async getSessionHistory(sessionId: string): Promise<PracticeHistoryRecord[]> {
    return this.db.select().from(practiceHistory).where(eq(practiceHistory.sessionId, sessionId));
  }

  async addHistoryRecord(record: Omit<NewPracticeHistoryRecord, "createdAt">): Promise<PracticeHistoryRecord> {
    const now = Date.now();
    const newRecord = {
      ...record,
      createdAt: now,
    };
    
    await this.db.insert(practiceHistory).values(newRecord);
    const result = await this.db.select().from(practiceHistory).where(eq(practiceHistory.id, record.id));
    return result[0];
  }

  async getRecentHistory(songId?: string, limit: number = 10): Promise<PracticeHistoryRecord[]> {
    if (songId) {
      return this.db.select().from(practiceHistory)
        .where(eq(practiceHistory.songId, songId))
        .limit(limit);
    }
    
    return this.db.select().from(practiceHistory).limit(limit);
  }

  parseSessionSections(session: PracticeSession): string[] {
    if (!session.sectionIds) return [];
    try {
      return JSON.parse(session.sectionIds);
    } catch {
      return [];
    }
  }

  serializeSectionIds(sectionIds: string[]): string {
    return JSON.stringify(sectionIds);
  }
}

export class PracticeEngine {
  private isActive = false;
  private startTime = 0;
  private currentLoop = 0;
  private currentMeasure = 1;
  private range: PracticeRange = { startMeasure: 1 };
  private loopSettings: LoopSettings = { enabled: false, currentLoop: 0 };
  private eventListeners: Map<string, ((progress: PracticeProgress) => void)[]> = new Map();

  constructor(
    private session: PracticeSession,
    private metronomeInstance: any
  ) {
    this.setupFromSession();
  }

  private setupFromSession() {
    this.range = {
      startMeasure: this.session.startMeasure,
      endMeasure: this.session.endMeasure || undefined,
    };

    this.loopSettings = {
      enabled: Boolean(this.session.loopEnabled),
      targetLoops: this.session.targetLoops || undefined,
      currentLoop: 0,
    };

    this.currentMeasure = this.range.startMeasure;
  }

  public addEventListener(event: string, listener: (progress: PracticeProgress) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public removeEventListener(event: string, listener: (progress: PracticeProgress) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitProgress() {
    const progress: PracticeProgress = {
      currentMeasure: this.currentMeasure,
      currentLoop: this.currentLoop,
      totalLoops: this.loopSettings.targetLoops || 0,
      isComplete: this.isComplete(),
      elapsedTime: this.isActive ? Date.now() - this.startTime : 0,
    };

    const listeners = this.eventListeners.get('progress') || [];
    listeners.forEach(listener => listener(progress));
  }

  public start(): void {
    this.isActive = true;
    this.startTime = Date.now();
    this.currentMeasure = this.range.startMeasure;
    this.currentLoop = 0;

    // Set metronome to start position
    if (this.session.tempo) {
      this.metronomeInstance.setBpm(this.session.tempo);
    }

    this.emitProgress();
  }

  public stop(): void {
    this.isActive = false;
    this.emitProgress();
  }

  public pause(): void {
    this.isActive = false;
  }

  public resume(): void {
    this.isActive = true;
    this.startTime = Date.now() - this.getElapsedTime();
  }

  public onMeasureChange(measure: number): void {
    this.currentMeasure = measure;

    // Check if we've reached the end of the practice range
    if (this.range.endMeasure && measure >= this.range.endMeasure) {
      if (this.loopSettings.enabled) {
        this.currentLoop++;
        this.currentMeasure = this.range.startMeasure;

        // Check if we've completed all target loops
        if (this.loopSettings.targetLoops && this.currentLoop >= this.loopSettings.targetLoops) {
          this.stop();
          this.emitComplete();
          return;
        }
      } else {
        this.stop();
        this.emitComplete();
        return;
      }
    }

    this.emitProgress();
  }

  public isComplete(): boolean {
    if (this.loopSettings.enabled && this.loopSettings.targetLoops) {
      return this.currentLoop >= this.loopSettings.targetLoops;
    }
    
    if (this.range.endMeasure) {
      return this.currentMeasure >= this.range.endMeasure;
    }

    return false;
  }

  public getElapsedTime(): number {
    return this.isActive ? Date.now() - this.startTime : 0;
  }

  public getProgress(): PracticeProgress {
    return {
      currentMeasure: this.currentMeasure,
      currentLoop: this.currentLoop,
      totalLoops: this.loopSettings.targetLoops || 0,
      isComplete: this.isComplete(),
      elapsedTime: this.getElapsedTime(),
    };
  }

  public updateRange(range: PracticeRange): void {
    this.range = range;
    this.currentMeasure = range.startMeasure;
  }

  public updateLoopSettings(settings: LoopSettings): void {
    this.loopSettings = settings;
  }

  private emitComplete(): void {
    const listeners = this.eventListeners.get('complete') || [];
    listeners.forEach(listener => listener(this.getProgress()));
  }

  public generateHistoryRecord(): Omit<NewPracticeHistoryRecord, "id" | "createdAt"> {
    return {
      sessionId: this.session.id,
      songId: this.session.songId,
      practiceDate: Date.now(),
      duration: Math.floor(this.getElapsedTime() / 1000),
      completedLoops: this.currentLoop,
      targetLoops: this.loopSettings.targetLoops,
      tempo: this.session.tempo || 120,
      notes: null,
    };
  }
}