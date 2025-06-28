import { useEffect, useState } from 'react';
import { useDataSync } from '../../lib/data-sync-context';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function SyncStatusIndicator({ className = '', showDetails = false }: SyncStatusIndicatorProps) {
  const { syncStatus, isInitialized, forceSyncAll } = useDataSync();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!syncStatus?.isOnline || isManualSyncing) return;
    
    setIsManualSyncing(true);
    try {
      await forceSyncAll();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return '未同期';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return '今すぐ';
  };

  const getStatusIcon = () => {
    if (!isInitialized) return '⏳';
    if (!syncStatus?.isOnline) return '🔴';
    if (syncStatus.pendingChanges > 0) return '🟡';
    if (syncStatus.conflictsCount > 0) return '⚠️';
    return '🟢';
  };

  const getStatusText = () => {
    if (!isInitialized) return '初期化中...';
    if (!syncStatus?.isOnline) return 'オフライン';
    if (syncStatus.pendingChanges > 0) return `同期中 (${syncStatus.pendingChanges}件)`;
    if (syncStatus.conflictsCount > 0) return `競合あり (${syncStatus.conflictsCount}件)`;
    return '同期済み';
  };

  const getStatusColor = () => {
    if (!isInitialized) return 'text-gray-500';
    if (!syncStatus?.isOnline) return 'text-red-600';
    if (syncStatus.pendingChanges > 0) return 'text-yellow-600';
    if (syncStatus.conflictsCount > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-lg">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">データ同期</h3>
        <button
          onClick={handleManualSync}
          disabled={!syncStatus?.isOnline || isManualSyncing}
          className={`
            px-3 py-1 rounded text-sm font-medium transition-all duration-150 touch-manipulation min-h-[32px]
            ${syncStatus?.isOnline && !isManualSyncing
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isManualSyncing ? '同期中...' : '手動同期'}
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs font-medium text-gray-600 mb-1">接続状態</div>
          <div className={`flex items-center gap-2 ${getStatusColor()}`}>
            <span className="text-lg">{getStatusIcon()}</span>
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs font-medium text-gray-600 mb-1">最終同期</div>
          <div className="text-sm font-medium text-gray-800">
            {formatLastSync(syncStatus?.lastSyncTime || null)}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {syncStatus && (
        <div className="space-y-3">
          {/* Pending Changes */}
          {syncStatus.pendingChanges > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600">🟡</span>
                <span className="text-sm font-medium text-yellow-800">
                  未同期の変更: {syncStatus.pendingChanges}件
                </span>
              </div>
              <div className="text-xs text-yellow-700">
                オンラインになると自動的に同期されます
              </div>
            </div>
          )}

          {/* Conflicts */}
          {syncStatus.conflictsCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600">⚠️</span>
                <span className="text-sm font-medium text-orange-800">
                  データ競合: {syncStatus.conflictsCount}件
                </span>
              </div>
              <div className="text-xs text-orange-700">
                手動での競合解決が必要です
              </div>
            </div>
          )}

          {/* Offline Mode */}
          {!syncStatus.isOnline && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600">🔴</span>
                <span className="text-sm font-medium text-red-800">
                  オフラインモード
                </span>
              </div>
              <div className="text-xs text-red-700">
                変更内容はローカルに保存され、オンライン復帰時に同期されます
              </div>
            </div>
          )}

          {/* All Good */}
          {syncStatus.isOnline && syncStatus.pendingChanges === 0 && syncStatus.conflictsCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600">🟢</span>
                <span className="text-sm font-medium text-green-800">
                  すべて同期済み
                </span>
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">デバイス情報</div>
            <div className="text-xs text-gray-500">
              ID: {syncStatus.deviceId.slice(-8)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}