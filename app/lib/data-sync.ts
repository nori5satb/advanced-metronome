import { eq, and, desc, gt } from "drizzle-orm";
import { syncData, deviceRegistrations, syncConflicts } from "../../database/schema";
import type { DB } from "./db";

export type SyncEntity = typeof syncData.$inferSelect;
export type NewSyncEntity = typeof syncData.$inferInsert;
export type DeviceRegistration = typeof deviceRegistrations.$inferSelect;
export type NewDeviceRegistration = typeof deviceRegistrations.$inferInsert;
export type SyncConflict = typeof syncConflicts.$inferSelect;
export type NewSyncConflict = typeof syncConflicts.$inferInsert;

export type EntityType = "song" | "section" | "practiceSession" | "practiceHistory";
export type SyncAction = "create" | "update" | "delete";
export type ConflictResolution = "local" | "remote" | "merge" | "manual";

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  conflictsCount: number;
  deviceId: string;
}

export interface SyncChange {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: SyncAction;
  data: any;
  timestamp: number;
  deviceId?: string;
}

export class DataSyncManager {
  private deviceId: string;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncQueue: SyncChange[] = [];
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(
    private db: DB,
    private userId: string,
    deviceId?: string
  ) {
    this.deviceId = deviceId || this.generateDeviceId();
    this.setupOnlineHandlers();
    this.loadPendingChanges();
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupOnlineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online', { isOnline: true });
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline', { isOnline: false });
    });
  }

  private async loadPendingChanges(): Promise<void> {
    try {
      const pending = await this.db
        .select()
        .from(syncData)
        .where(and(
          eq(syncData.userId, this.userId),
          eq(syncData.isProcessed, 0)
        ))
        .orderBy(syncData.timestamp);

      this.syncQueue = pending.map(item => ({
        id: item.id,
        entityType: item.entityType as EntityType,
        entityId: item.entityId,
        action: item.action as SyncAction,
        data: item.data ? JSON.parse(item.data) : null,
        timestamp: item.timestamp,
        deviceId: item.deviceId || undefined
      }));
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  }

  public addEventListener(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public removeEventListener(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  public async registerDevice(deviceName: string, deviceType: string): Promise<void> {
    const now = Date.now();
    const registration: NewDeviceRegistration = {
      id: crypto.randomUUID(),
      userId: this.userId,
      deviceId: this.deviceId,
      deviceName,
      deviceType,
      lastSyncAt: now,
      isActive: 1,
      syncVersion: 1,
      createdAt: now,
      updatedAt: now
    };

    await this.db.insert(deviceRegistrations).values(registration);
  }

  public async queueChange(
    entityType: EntityType,
    entityId: string,
    action: SyncAction,
    data?: any
  ): Promise<void> {
    const now = Date.now();
    const changeId = crypto.randomUUID();

    const syncChange: SyncChange = {
      id: changeId,
      entityType,
      entityId,
      action,
      data,
      timestamp: now,
      deviceId: this.deviceId
    };

    this.syncQueue.push(syncChange);

    // Save to database for offline persistence
    const syncEntity: NewSyncEntity = {
      id: changeId,
      userId: this.userId,
      entityType,
      entityId,
      action,
      data: data ? JSON.stringify(data) : null,
      timestamp: now,
      deviceId: this.deviceId,
      isProcessed: 0,
      conflictResolved: 0,
      createdAt: now
    };

    await this.db.insert(syncData).values(syncEntity);

    this.emit('changeQueued', { change: syncChange, queueLength: this.syncQueue.length });

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncPendingChanges();
    }
  }

  public async syncPendingChanges(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline) {
      return false;
    }

    this.syncInProgress = true;
    this.emit('syncStart', { pendingChanges: this.syncQueue.length });

    try {
      // Process each change in the queue
      for (const change of this.syncQueue) {
        await this.processChange(change);
      }

      // Clear processed changes
      await this.clearProcessedChanges();
      this.syncQueue = [];

      // Update device sync time
      await this.updateDeviceSyncTime();

      this.emit('syncComplete', { success: true });
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('syncError', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processChange(change: SyncChange): Promise<void> {
    try {
      // Check for conflicts with remote data
      const conflict = await this.detectConflict(change);
      
      if (conflict) {
        await this.handleConflict(change, conflict);
      } else {
        await this.applyChange(change);
      }

      // Mark as processed
      await this.db
        .update(syncData)
        .set({ isProcessed: 1 })
        .where(eq(syncData.id, change.id));

    } catch (error) {
      console.error(`Failed to process change ${change.id}:`, error);
      throw error;
    }
  }

  private async detectConflict(change: SyncChange): Promise<any> {
    // Simulate conflict detection by checking if remote data was modified
    // after this change was created
    const remoteChanges = await this.db
      .select()
      .from(syncData)
      .where(and(
        eq(syncData.entityType, change.entityType),
        eq(syncData.entityId, change.entityId),
        gt(syncData.timestamp, change.timestamp),
        eq(syncData.isProcessed, 1)
      ))
      .limit(1);

    return remoteChanges.length > 0 ? remoteChanges[0] : null;
  }

  private async handleConflict(change: SyncChange, remoteChange: any): Promise<void> {
    const conflictId = crypto.randomUUID();
    const now = Date.now();

    const conflict: NewSyncConflict = {
      id: conflictId,
      userId: this.userId,
      entityType: change.entityType,
      entityId: change.entityId,
      localData: JSON.stringify(change.data),
      remoteData: remoteChange.data,
      conflictType: 'update_conflict',
      resolution: null,
      resolvedData: null,
      isResolved: 0,
      createdAt: now,
      resolvedAt: null
    };

    await this.db.insert(syncConflicts).values(conflict);

    // For now, use "remote wins" strategy
    await this.resolveConflict(conflictId, 'remote');

    this.emit('conflictDetected', { change, conflict: conflictId });
  }

  public async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedData?: any
  ): Promise<void> {
    const now = Date.now();

    await this.db
      .update(syncConflicts)
      .set({
        resolution,
        resolvedData: resolvedData ? JSON.stringify(resolvedData) : null,
        isResolved: 1,
        resolvedAt: now
      })
      .where(eq(syncConflicts.id, conflictId));

    this.emit('conflictResolved', { conflictId, resolution });
  }

  private async applyChange(change: SyncChange): Promise<void> {
    // This would integrate with existing repositories
    // For now, just emit the change for the application to handle
    this.emit('changeApplied', change);
  }

  private async clearProcessedChanges(): Promise<void> {
    await this.db
      .delete(syncData)
      .where(and(
        eq(syncData.userId, this.userId),
        eq(syncData.isProcessed, 1)
      ));
  }

  private async updateDeviceSyncTime(): Promise<void> {
    const now = Date.now();
    await this.db
      .update(deviceRegistrations)
      .set({
        lastSyncAt: now,
        updatedAt: now
      })
      .where(and(
        eq(deviceRegistrations.userId, this.userId),
        eq(deviceRegistrations.deviceId, this.deviceId)
      ));
  }

  public async getSyncStatus(): Promise<SyncStatus> {
    const pendingChanges = this.syncQueue.length;
    
    const conflicts = await this.db
      .select()
      .from(syncConflicts)
      .where(and(
        eq(syncConflicts.userId, this.userId),
        eq(syncConflicts.isResolved, 0)
      ));

    const device = await this.db
      .select()
      .from(deviceRegistrations)
      .where(and(
        eq(deviceRegistrations.userId, this.userId),
        eq(deviceRegistrations.deviceId, this.deviceId)
      ))
      .limit(1);

    return {
      isOnline: this.isOnline,
      lastSyncTime: device[0]?.lastSyncAt || null,
      pendingChanges,
      conflictsCount: conflicts.length,
      deviceId: this.deviceId
    };
  }

  public async getPendingConflicts(): Promise<SyncConflict[]> {
    return this.db
      .select()
      .from(syncConflicts)
      .where(and(
        eq(syncConflicts.userId, this.userId),
        eq(syncConflicts.isResolved, 0)
      ))
      .orderBy(desc(syncConflicts.createdAt));
  }

  public async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot force sync while offline');
    }

    this.emit('forceSyncStart', {});
    await this.syncPendingChanges();
  }

  public destroy(): void {
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
    this.eventListeners.clear();
  }
}

export class OfflineStorageManager {
  private readonly STORAGE_KEY = 'metronome_offline_data';
  
  public saveToLocal(key: string, data: any): void {
    try {
      const storage = this.getLocalStorage();
      storage[key] = {
        data,
        timestamp: Date.now(),
        lastModified: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }

  public getFromLocal(key: string): any {
    try {
      const storage = this.getLocalStorage();
      return storage[key]?.data || null;
    } catch (error) {
      console.error('Failed to get from local storage:', error);
      return null;
    }
  }

  public removeFromLocal(key: string): void {
    try {
      const storage = this.getLocalStorage();
      delete storage[key];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to remove from local storage:', error);
    }
  }

  public getAllLocalData(): Record<string, any> {
    return this.getLocalStorage();
  }

  public clearAllLocal(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private getLocalStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse local storage:', error);
      return {};
    }
  }

  public getStorageSize(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }
}