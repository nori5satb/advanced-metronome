import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { DataSyncManager, OfflineStorageManager } from './data-sync';
import type { SyncStatus, SyncChange } from './data-sync';

interface DataSyncContextValue {
  syncManager: DataSyncManager | null;
  offlineStorage: OfflineStorageManager;
  syncStatus: SyncStatus | null;
  isInitialized: boolean;
  queueChange: (entityType: string, entityId: string, action: string, data?: any) => Promise<void>;
  forceSyncAll: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: string, resolvedData?: any) => Promise<void>;
  getSyncStatus: () => Promise<SyncStatus>;
}

const DataSyncContext = createContext<DataSyncContextValue | null>(null);

interface DataSyncProviderProps {
  children: ReactNode;
  userId?: string;
  db?: any; // DB instance
}

export function DataSyncProvider({ children, userId, db }: DataSyncProviderProps) {
  const [syncManager, setSyncManager] = useState<DataSyncManager | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const offlineStorage = new OfflineStorageManager();

  useEffect(() => {
    if (userId && db) {
      initializeSyncManager();
    }
  }, [userId, db]);

  const initializeSyncManager = async () => {
    try {
      const manager = new DataSyncManager(db, userId!);
      
      // Register device if not already registered
      await manager.registerDevice(
        getDeviceName(),
        getDeviceType()
      );

      // Set up event listeners
      manager.addEventListener('syncStart', handleSyncStart);
      manager.addEventListener('syncComplete', handleSyncComplete);
      manager.addEventListener('syncError', handleSyncError);
      manager.addEventListener('changeQueued', handleChangeQueued);
      manager.addEventListener('conflictDetected', handleConflictDetected);
      manager.addEventListener('online', handleOnline);
      manager.addEventListener('offline', handleOffline);

      setSyncManager(manager);
      
      // Get initial sync status
      const status = await manager.getSyncStatus();
      setSyncStatus(status);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
    }
  };

  const handleSyncStart = (data: any) => {
    console.log('Sync started:', data);
    updateSyncStatus();
  };

  const handleSyncComplete = (data: any) => {
    console.log('Sync completed:', data);
    updateSyncStatus();
  };

  const handleSyncError = (data: any) => {
    console.error('Sync error:', data);
    updateSyncStatus();
  };

  const handleChangeQueued = (data: any) => {
    console.log('Change queued:', data);
    updateSyncStatus();
  };

  const handleConflictDetected = (data: any) => {
    console.log('Conflict detected:', data);
    updateSyncStatus();
    // Could show notification to user
  };

  const handleOnline = () => {
    console.log('Device came online');
    updateSyncStatus();
  };

  const handleOffline = () => {
    console.log('Device went offline');
    updateSyncStatus();
  };

  const updateSyncStatus = useCallback(async () => {
    if (syncManager) {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to update sync status:', error);
      }
    }
  }, [syncManager]);

  const queueChange = useCallback(async (
    entityType: string,
    entityId: string,
    action: string,
    data?: any
  ) => {
    if (!syncManager) {
      throw new Error('Sync manager not initialized');
    }

    await syncManager.queueChange(
      entityType as any,
      entityId,
      action as any,
      data
    );
  }, [syncManager]);

  const forceSyncAll = useCallback(async () => {
    if (!syncManager) {
      throw new Error('Sync manager not initialized');
    }

    await syncManager.forceSyncAll();
  }, [syncManager]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: string,
    resolvedData?: any
  ) => {
    if (!syncManager) {
      throw new Error('Sync manager not initialized');
    }

    await syncManager.resolveConflict(
      conflictId,
      resolution as any,
      resolvedData
    );
  }, [syncManager]);

  const getSyncStatus = useCallback(async () => {
    if (!syncManager) {
      throw new Error('Sync manager not initialized');
    }

    return await syncManager.getSyncStatus();
  }, [syncManager]);

  useEffect(() => {
    return () => {
      if (syncManager) {
        syncManager.destroy();
      }
    };
  }, [syncManager]);

  const value: DataSyncContextValue = {
    syncManager,
    offlineStorage,
    syncStatus,
    isInitialized,
    queueChange,
    forceSyncAll,
    resolveConflict,
    getSyncStatus
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync(): DataSyncContextValue {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Mobile')) {
    return 'Mobile Device';
  } else if (userAgent.includes('Tablet')) {
    return 'Tablet Device';
  } else {
    return 'Desktop Device';
  }
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Mobile')) {
    return 'mobile';
  } else if (userAgent.includes('Tablet')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}