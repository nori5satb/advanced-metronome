import { useState, useEffect } from 'react';
import { useDataSync } from '../../lib/data-sync-context';
import type { SyncConflict } from '../../lib/data-sync';

interface ConflictResolverProps {
  className?: string;
}

export default function ConflictResolver({ className = '' }: ConflictResolverProps) {
  const { syncManager, resolveConflict } = useDataSync();
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, [syncManager]);

  const loadConflicts = async () => {
    if (!syncManager) return;
    
    try {
      const pendingConflicts = await syncManager.getPendingConflicts();
      setConflicts(pendingConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    resolvedData?: any
  ) => {
    setIsResolving(true);
    try {
      await resolveConflict(conflictId, resolution, resolvedData);
      await loadConflicts(); // Reload conflicts
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatEntityType = (entityType: string) => {
    const types = {
      song: '楽曲',
      section: 'セクション',
      practiceSession: '練習セッション',
      practiceHistory: '練習履歴'
    };
    return types[entityType as keyof typeof types] || entityType;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const parseData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  if (conflicts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">データ競合</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-gray-600">競合は発生していません</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        データ競合の解決 ({conflicts.length}件)
      </h3>

      {!selectedConflict ? (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="border border-orange-200 rounded-lg p-4 bg-orange-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-orange-800">
                  {formatEntityType(conflict.entityType)} の競合
                </div>
                <button
                  onClick={() => setSelectedConflict(conflict)}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
                >
                  解決する
                </button>
              </div>
              <div className="text-sm text-orange-700">
                発生日時: {formatTimestamp(conflict.createdAt)}
              </div>
              <div className="text-sm text-orange-700">
                種類: {conflict.conflictType === 'update_conflict' ? '更新競合' : '削除競合'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedConflict(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span>競合一覧に戻る</span>
          </button>

          {/* Conflict Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">
              {formatEntityType(selectedConflict.entityType)} の競合
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>エンティティID: {selectedConflict.entityId}</div>
              <div>発生日時: {formatTimestamp(selectedConflict.createdAt)}</div>
              <div>種類: {selectedConflict.conflictType === 'update_conflict' ? '更新競合' : '削除競合'}</div>
            </div>
          </div>

          {/* Data Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Data */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-blue-800 mb-2">ローカルデータ</h5>
              <pre className="text-xs bg-blue-50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(parseData(selectedConflict.localData), null, 2)}
              </pre>
            </div>

            {/* Remote Data */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">リモートデータ</h5>
              <pre className="text-xs bg-green-50 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(parseData(selectedConflict.remoteData), null, 2)}
              </pre>
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800">解決方法を選択してください：</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleResolveConflict(selectedConflict.id, 'local')}
                disabled={isResolving}
                className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-blue-800 mb-1">ローカルを採用</div>
                <div className="text-xs text-blue-600">このデバイスのデータを使用</div>
              </button>

              <button
                onClick={() => handleResolveConflict(selectedConflict.id, 'remote')}
                disabled={isResolving}
                className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-green-800 mb-1">リモートを採用</div>
                <div className="text-xs text-green-600">サーバーのデータを使用</div>
              </button>

              <button
                onClick={() => handleResolveConflict(selectedConflict.id, 'merge')}
                disabled={isResolving}
                className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-purple-800 mb-1">マージ</div>
                <div className="text-xs text-purple-600">両方のデータを統合</div>
              </button>
            </div>

            {isResolving && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>競合を解決中...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}