import type { ReactNode } from 'react';
import { useState } from 'react';
import type { SheetMusicAnalysisResult } from '~/lib/sheet-music-analysis';
import { SheetMusicIntegration } from '~/lib/sheet-music-integration';

interface SheetMusicPresetsProps {
  analysis: SheetMusicAnalysisResult;
  onApplyPreset: (presetName: string, settings: any) => void;
  className?: string;
}

export default function SheetMusicPresets({
  analysis,
  onApplyPreset,
  className = ''
}: SheetMusicPresetsProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const integration = new SheetMusicIntegration();
  const presets = integration.generateMetronomePresets(analysis);

  const handlePresetSelect = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
  };

  const handleApplyPreset = () => {
    if (selectedPreset !== null && presets[selectedPreset]) {
      const preset = presets[selectedPreset];
      onApplyPreset(preset.name, preset.settings);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    const level = integration.getConfidenceLevel(confidence);
    const label = integration.getConfidenceLevelLabel(level);
    const color = integration.getConfidenceLevelColor(level);
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color} bg-opacity-10`}>
        {label}
      </span>
    );
  };

  const formatSettings = (settings: any) => {
    const parts: string[] = [];
    
    if (settings.bpm) {
      parts.push(`${settings.bpm} BPM`);
    }
    
    if (settings.timeSignatureNumerator && settings.timeSignatureDenominator) {
      parts.push(`${settings.timeSignatureNumerator}/${settings.timeSignatureDenominator}`);
    }
    
    if (settings.loopEnabled && settings.loopStartMeasure && settings.loopEndMeasure) {
      parts.push(`小節 ${settings.loopStartMeasure}-${settings.loopEndMeasure}`);
    }
    
    return parts.join(' • ');
  };

  if (presets.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146.832-5.657 2.343m0 0L3 20.657M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">プリセットが利用できません</p>
          <p className="text-sm text-gray-600">
            楽譜解析からメトロノーム設定を抽出できませんでした
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          メトロノームプリセット
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          楽譜解析結果からメトロノーム設定を適用できます
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {presets.map((preset, index) => (
            <div
              key={index}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all duration-200
                ${selectedPreset === index 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              onClick={() => handlePresetSelect(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{preset.name}</h4>
                    {getConfidenceBadge(preset.confidence)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {formatSettings(preset.settings)}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedPreset === index 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedPreset === index && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedPreset !== null ? (
              <span>
                選択中: <span className="font-medium">{presets[selectedPreset].name}</span>
              </span>
            ) : (
              'プリセットを選択してください'
            )}
          </div>
          
          <button
            onClick={handleApplyPreset}
            disabled={selectedPreset === null}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${selectedPreset !== null
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            設定を適用
          </button>
        </div>

        {/* Preview of selected preset */}
        {selectedPreset !== null && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">適用される設定</h5>
            <div className="text-sm text-blue-800 space-y-1">
              {presets[selectedPreset].settings.bpm && (
                <div>テンポ: {presets[selectedPreset].settings.bpm} BPM</div>
              )}
              {presets[selectedPreset].settings.timeSignatureNumerator && 
               presets[selectedPreset].settings.timeSignatureDenominator && (
                <div>
                  拍子: {presets[selectedPreset].settings.timeSignatureNumerator}/
                  {presets[selectedPreset].settings.timeSignatureDenominator}
                </div>
              )}
              {presets[selectedPreset].settings.loopEnabled && (
                <div>
                  ループ: 小節 {presets[selectedPreset].settings.loopStartMeasure}-
                  {presets[selectedPreset].settings.loopEndMeasure}
                </div>
              )}
            </div>
            
            {integration.getConfidenceLevel(presets[selectedPreset].confidence) === 'low' && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>注意:</strong> この設定の信頼度は低めです。手動で確認・調整することをお勧めします。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}