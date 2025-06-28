import { useState, useEffect } from 'react';
import { getTempoScalingInstance } from '../../lib/tempo-scaling';
import type { Section } from '../../lib/songs';
import type { TempoAdjustment, TempoScalingState } from '../../lib/tempo-scaling';

interface TempoScalingPanelProps {
  sections: Section[];
  onApplyScaling: (adjustments: TempoAdjustment[]) => Promise<void>;
  onPreviewScaling: (adjustments: TempoAdjustment[]) => void;
  onResetScaling: () => void;
  className?: string;
}

export default function TempoScalingPanel({
  sections,
  onApplyScaling,
  onPreviewScaling,
  onResetScaling,
  className = ''
}: TempoScalingPanelProps) {
  const [scaling, setScaling] = useState(1.0);
  const [excludedSections, setExcludedSections] = useState<Set<string>>(new Set());
  const [adjustments, setAdjustments] = useState<TempoAdjustment[]>([]);
  const [savedState, setSavedState] = useState<TempoScalingState | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const tempoEngine = getTempoScalingInstance();

  // スケーリング値または除外設定が変更されたら調整を再計算
  useEffect(() => {
    const newAdjustments = tempoEngine.calculateAdjustments(sections, scaling, excludedSections);
    setAdjustments(newAdjustments);
  }, [sections, scaling, excludedSections, tempoEngine]);

  const handleScalingChange = (newScaling: number) => {
    if (tempoEngine.validateScaling(newScaling)) {
      setScaling(newScaling);
    }
  };

  const handleSectionExclusionToggle = (sectionId: string) => {
    const newExcluded = new Set(excludedSections);
    if (newExcluded.has(sectionId)) {
      newExcluded.delete(sectionId);
    } else {
      newExcluded.add(sectionId);
    }
    setExcludedSections(newExcluded);
  };

  const handlePreview = () => {
    setIsPreviewMode(true);
    onPreviewScaling(adjustments);
  };

  const handleApply = async () => {
    const validation = tempoEngine.validateAdjustments(adjustments);
    if (!validation.isValid) {
      alert(`適用できません:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsApplying(true);
    try {
      await onApplyScaling(adjustments);
      setSavedState({
        scaling,
        adjustments: [...adjustments],
        isPreviewMode: false
      });
      setIsPreviewMode(false);
    } catch (error) {
      console.error('テンポ調整の適用に失敗:', error);
      alert('テンポ調整の適用に失敗しました');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setScaling(1.0);
    setExcludedSections(new Set());
    setIsPreviewMode(false);
    onResetScaling();
  };

  const handleRestore = () => {
    if (savedState) {
      setScaling(savedState.scaling);
      const newExcluded = new Set(
        savedState.adjustments
          .filter(adj => adj.isExcluded)
          .map(adj => adj.sectionId)
      );
      setExcludedSections(newExcluded);
    }
  };

  const statistics = tempoEngine.calculateStatistics(adjustments);
  const differences = tempoEngine.calculateDifferences(adjustments);
  const presets = tempoEngine.getPresetScalings();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          一括テンポ調整
        </h2>
        <p className="text-gray-600">
          全セクションのテンポを一括で調整できます
        </p>
      </div>

      {/* スケーリング調整 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          テンポ倍率: {scaling.toFixed(1)}x
        </label>
        
        {/* スライダー */}
        <div className="mb-4">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={scaling}
            onChange={(e) => handleScalingChange(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((scaling - 0.5) / 1.5) * 100}%, #e5e7eb ${((scaling - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>

        {/* 数値入力 */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.5"
            max="2.0"
            step="0.1"
            value={scaling}
            onChange={(e) => handleScalingChange(parseFloat(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-center"
          />
          <span className="text-gray-600">倍</span>
        </div>
      </div>

      {/* プリセット */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          クイックプリセット
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map(preset => (
            <button
              key={preset.value}
              onClick={() => handleScalingChange(preset.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                Math.abs(scaling - preset.value) < 0.01
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* セクション一覧と除外設定 */}
      {sections.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            セクション別設定
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sections.map((section, index) => {
              const adjustment = adjustments.find(adj => adj.sectionId === section.id);
              const difference = differences.find(diff => diff.sectionId === section.id);
              
              return (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!excludedSections.has(section.id)}
                      onChange={() => handleSectionExclusionToggle(section.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-sm">
                        {section.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {section.tempo} BPM → {adjustment?.newTempo || section.tempo} BPM
                        {difference && difference.difference !== 0 && (
                          <span className={`ml-2 ${difference.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({difference.difference > 0 ? '+' : ''}{difference.difference} BPM)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {excludedSections.has(section.id) && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      除外
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 統計情報 */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">調整統計</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-700">対象セクション</div>
            <div className="font-medium">{statistics.adjustedSections}/{statistics.totalSections}</div>
          </div>
          <div>
            <div className="text-blue-700">除外セクション</div>
            <div className="font-medium">{statistics.excludedSections}</div>
          </div>
          <div>
            <div className="text-blue-700">平均テンポ (元)</div>
            <div className="font-medium">{statistics.averageOriginalTempo} BPM</div>
          </div>
          <div>
            <div className="text-blue-700">平均テンポ (新)</div>
            <div className="font-medium">{statistics.averageNewTempo} BPM</div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePreview}
          disabled={scaling === 1.0 && excludedSections.size === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          プレビュー
        </button>
        
        <button
          onClick={handleApply}
          disabled={isApplying || (scaling === 1.0 && excludedSections.size === 0)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isApplying ? '適用中...' : '適用'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          リセット
        </button>
        
        {savedState && (
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            前回設定を復元
          </button>
        )}
      </div>

      {/* プレビュー状態の表示 */}
      {isPreviewMode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-yellow-800 text-sm font-medium">
              プレビューモード中 - 「適用」ボタンで確定してください
            </span>
          </div>
        </div>
      )}
    </div>
  );
}