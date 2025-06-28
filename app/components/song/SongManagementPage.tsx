import { useState, useEffect } from 'react';
import { type Song, type Section } from '../../lib/songs';
import TempoScalingPanel from '../tempo/TempoScalingPanel';
import type { TempoAdjustment } from '../../lib/tempo-scaling';

interface SongManagementPageProps {
  songs: Song[];
  onUpdateSections: (updates: Array<{ sectionId: string; tempo: number }>) => Promise<void>;
  onCreateSong?: (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export default function SongManagementPage({
  songs,
  onUpdateSections,
  onCreateSong
}: SongManagementPageProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTempoScaling, setShowTempoScaling] = useState(false);

  // 選択された楽曲のセクション一覧を取得
  useEffect(() => {
    if (selectedSong) {
      fetchSections(selectedSong.id);
    } else {
      setSections([]);
    }
  }, [selectedSong]);

  const fetchSections = async (songId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/songs/${songId}/sections`);
      if (response.ok) {
        const data = await response.json() as { sections?: Section[] };
        setSections(data.sections || []);
      } else {
        console.error('セクション取得に失敗しました');
        setSections([]);
      }
    } catch (error) {
      console.error('セクション取得エラー:', error);
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTempoScaling = async (adjustments: TempoAdjustment[]) => {
    const updates = adjustments
      .filter(adj => !adj.isExcluded && adj.newTempo !== adj.originalTempo)
      .map(adj => ({
        sectionId: adj.sectionId,
        tempo: adj.newTempo
      }));

    if (updates.length === 0) {
      alert('変更するセクションがありません');
      return;
    }

    try {
      await onUpdateSections(updates);
      
      // ローカル状態を更新
      setSections(prevSections => 
        prevSections.map(section => {
          const update = updates.find(u => u.sectionId === section.id);
          return update ? { ...section, tempo: update.tempo } : section;
        })
      );

      alert(`${updates.length}個のセクションのテンポを更新しました`);
    } catch (error) {
      console.error('テンポ更新エラー:', error);
      throw error;
    }
  };

  const handlePreviewTempoScaling = (adjustments: TempoAdjustment[]) => {
    // プレビュー機能の実装（将来的にメトロノームと連携）
    console.log('プレビュー:', adjustments);
  };

  const handleResetTempoScaling = () => {
    // リセット処理
    console.log('テンポ調整をリセット');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            楽曲管理
          </h1>
          <p className="text-gray-600">
            楽曲とセクションの管理、一括テンポ調整
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 楽曲一覧 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                楽曲一覧
              </h2>
              
              {songs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  楽曲がありません
                </p>
              ) : (
                <div className="space-y-2">
                  {songs.map(song => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedSong?.id === song.id
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{song.title}</div>
                      {song.artist && (
                        <div className="text-sm text-gray-600">{song.artist}</div>
                      )}
                      {song.defaultTempo && (
                        <div className="text-xs text-gray-500">
                          デフォルト: {song.defaultTempo} BPM
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* セクション詳細と一括調整 */}
          <div className="lg:col-span-2">
            {selectedSong ? (
              <div className="space-y-6">
                {/* セクション一覧 */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {selectedSong.title} - セクション一覧
                    </h2>
                    <button
                      onClick={() => setShowTempoScaling(!showTempoScaling)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      {showTempoScaling ? '一括調整を閉じる' : '一括テンポ調整'}
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">読み込み中...</div>
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">セクションがありません</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{section.name}</div>
                              <div className="text-sm text-gray-600">
                                {section.measures}小節 • {section.timeSignature}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {section.tempo} BPM
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 一括テンポ調整パネル */}
                {showTempoScaling && sections.length > 0 && (
                  <TempoScalingPanel
                    sections={sections}
                    onApplyScaling={handleApplyTempoScaling}
                    onPreviewScaling={handlePreviewTempoScaling}
                    onResetScaling={handleResetTempoScaling}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🎵</div>
                  <div className="text-lg mb-2">楽曲を選択してください</div>
                  <div className="text-sm">
                    左側の楽曲一覧から楽曲を選択すると、セクション管理と一括テンポ調整が利用できます
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}