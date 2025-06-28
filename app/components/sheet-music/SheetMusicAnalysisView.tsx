import type { ReactNode } from 'react';
import type { SheetMusicAnalysisResult } from '~/lib/sheet-music-analysis';
import { SheetMusicManager } from '~/lib/sheet-music-manager';

interface SheetMusicAnalysisViewProps {
  analysis: SheetMusicAnalysisResult;
  onApplyToMetronome?: (settings: any) => void;
  className?: string;
}

export default function SheetMusicAnalysisView({
  analysis,
  onApplyToMetronome,
  className = ''
}: SheetMusicAnalysisViewProps) {
  const manager = new SheetMusicManager();
  const quality = manager.getAnalysisQuality(analysis);
  const qualityLabel = manager.getAnalysisQualityLabel(quality);
  const qualityColor = manager.getAnalysisQualityColor(quality);

  const handleApplySettings = () => {
    if (onApplyToMetronome) {
      const settings = manager.extractMetronomeSettings(analysis);
      onApplyToMetronome(settings);
    }
  };

  const formatConfidence = (confidence?: number) => {
    if (confidence === undefined) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  };

  const formatProcessingTime = (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              楽譜解析結果
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              処理時間: {formatProcessingTime(analysis.processingTimeMs)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">解析品質</p>
              <p className={`font-medium ${qualityColor}`}>
                {qualityLabel} ({formatConfidence(analysis.confidenceScore)})
              </p>
            </div>
            {onApplyToMetronome && (
              <button
                onClick={handleApplySettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={quality === 'poor'}
              >
                メトロノームに適用
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Messages */}
        {analysis.errorMessages.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">エラー・警告</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {analysis.errorMessages.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Analysis Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tempo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">テンポ</h4>
              <span className="text-xs text-gray-500">
                {formatConfidence(analysis.tempoConfidence)}
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.detectedTempo ? `${analysis.detectedTempo} BPM` : '未検出'}
            </div>
          </div>

          {/* Time Signature */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">拍子</h4>
              <span className="text-xs text-gray-500">
                {formatConfidence(analysis.timeSignatureConfidence)}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {analysis.detectedTimeSignature || '未検出'}
            </div>
          </div>

          {/* Key Signature */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">調</h4>
              <span className="text-xs text-gray-500">
                {formatConfidence(analysis.keyConfidence)}
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {analysis.detectedKey || '未検出'}
            </div>
          </div>
        </div>

        {/* Structure Analysis */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">楽曲構成</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900">
                    {manager.generateSectionData(analysis)[index]?.name || section.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatConfidence(section.confidence)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>小節 {section.startMeasure}-{section.endMeasure}</p>
                  {section.tempo && (
                    <p>テンポ: {section.tempo} BPM</p>
                  )}
                  {section.timeSignature && (
                    <p>拍子: {section.timeSignature}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analysis.totalMeasures || 0}
            </p>
            <p className="text-sm text-gray-600">総小節数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analysis.sections.length}
            </p>
            <p className="text-sm text-gray-600">セクション数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analysis.elements.length}
            </p>
            <p className="text-sm text-gray-600">検出要素数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analysis.totalPages || 1}
            </p>
            <p className="text-sm text-gray-600">ページ数</p>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="pt-4 border-t border-gray-200">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            技術的詳細を表示
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">解析バージョン</h5>
              <p className="text-sm text-gray-600">{analysis.analysisVersion}</p>
            </div>
            
            {analysis.analysisMetadata && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">メタデータ</h5>
                <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(analysis.analysisMetadata, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">検出要素 ({analysis.elements.length})</h5>
              <div className="max-h-40 overflow-y-auto">
                <div className="text-xs text-gray-600 space-y-1">
                  {analysis.elements.map((element, index) => (
                    <div key={element.id} className="flex justify-between">
                      <span>{element.type}: {element.value}</span>
                      <span>{formatConfidence(element.confidence)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}