import { useState } from 'react';
import { useMetronome } from '../../lib/metronome-context';

interface PracticeSessionControlsProps {
  className?: string;
}

export default function PracticeSessionControls({ className = '' }: PracticeSessionControlsProps) {
  const { 
    settings, 
    setLoopEnabled,
    setLoopRange,
    setTargetLoops,
    jumpToMeasure
  } = useMetronome();

  const [startMeasure, setStartMeasure] = useState(settings.loopStartMeasure);
  const [endMeasure, setEndMeasure] = useState(settings.loopEndMeasure);
  const [targetLoops, setTargetLoopsState] = useState(settings.targetLoops);

  const handleLoopToggle = () => {
    setLoopEnabled(!settings.loopEnabled);
  };

  const handleStartMeasureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1) {
      setStartMeasure(value);
      if (value < endMeasure) {
        setLoopRange(value, endMeasure);
      }
    }
  };

  const handleEndMeasureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > startMeasure) {
      setEndMeasure(value);
      setLoopRange(startMeasure, value);
    }
  };

  const handleTargetLoopsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setTargetLoopsState(value);
      setTargetLoops(value);
    }
  };

  const handleJumpToStart = () => {
    jumpToMeasure(startMeasure);
  };

  const handleJumpToMeasure = (event: React.ChangeEvent<HTMLInputElement>) => {
    const measure = parseInt(event.target.value);
    if (!isNaN(measure) && measure >= 1) {
      jumpToMeasure(measure);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">部分練習とループ</h3>
      
      {/* Loop Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            ループ再生
          </label>
          <button
            onClick={handleLoopToggle}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out touch-manipulation
              ${settings.loopEnabled ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                ${settings.loopEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        
        {settings.loopEnabled && (
          <div className="space-y-4 pl-4 border-l-2 border-blue-200">
            {/* Loop Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  開始小節
                </label>
                <input
                  type="number"
                  min="1"
                  value={startMeasure}
                  onChange={handleStartMeasureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  終了小節
                </label>
                <input
                  type="number"
                  min={startMeasure + 1}
                  value={endMeasure}
                  onChange={handleEndMeasureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px]"
                />
              </div>
            </div>

            {/* Target Loops */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                目標ループ回数 (0 = 無限)
              </label>
              <input
                type="number"
                min="0"
                value={targetLoops}
                onChange={handleTargetLoopsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px]"
              />
            </div>

            {/* Loop Progress */}
            <div className="bg-blue-50 rounded p-3">
              <div className="text-xs font-medium text-blue-800 mb-1">
                ループ進行状況
              </div>
              <div className="text-sm text-blue-700">
                {settings.currentLoop} / {settings.targetLoops || '∞'} 回完了
              </div>
              {settings.targetLoops > 0 && (
                <div className="mt-2">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (settings.currentLoop / settings.targetLoops) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          クイックナビゲーション
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleJumpToStart}
            disabled={!settings.loopEnabled}
            className={`
              px-3 py-2 rounded text-sm font-medium transition-all duration-150 touch-manipulation min-h-[44px]
              ${settings.loopEnabled
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            練習開始位置へ
          </button>
        </div>
      </div>

      {/* Jump to Measure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          指定小節へジャンプ
        </label>
        <input
          type="number"
          min="1"
          placeholder="小節番号を入力"
          onChange={handleJumpToMeasure}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px]"
        />
      </div>

      {/* Practice Tips */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">
          練習のコツ
        </h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• 難しい箇所は小節範囲を狭めて集中練習</li>
          <li>• ループ回数を設定して反復練習の目標を作る</li>
          <li>• 徐々にテンポを上げて段階的にレベルアップ</li>
          <li>• 完璧に弾けるまで同じ箇所を繰り返す</li>
        </ul>
      </div>
    </div>
  );
}