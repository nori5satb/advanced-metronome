import type { ReactNode } from 'react';
import { useState } from 'react';
import SheetMusicUpload from '~/components/sheet-music/SheetMusicUpload';
import SheetMusicAnalysisView from '~/components/sheet-music/SheetMusicAnalysisView';
import type { SheetMusicFile } from '~/lib/sheet-music-manager';
import type { SheetMusicAnalysisResult } from '~/lib/sheet-music-analysis';

export default function SheetMusicPage() {
  const [selectedFile, setSelectedFile] = useState<SheetMusicFile | null>(null);
  const [analysis, setAnalysis] = useState<SheetMusicAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFileSelect = (file: SheetMusicFile) => {
    setSelectedFile(file);
    setAnalysis(null);
    setShowAnalysis(false);
  };

  const handleAnalysisComplete = (analysisResult: SheetMusicAnalysisResult) => {
    setAnalysis(analysisResult);
    setShowAnalysis(true);
  };

  const handleApplyToMetronome = (settings: any) => {
    // In a real app, this would integrate with the metronome
    console.log('Applying settings to metronome:', settings);
    alert(`設定をメトロノームに適用:\nテンポ: ${settings.tempo || 'N/A'} BPM\n拍子: ${settings.timeSignature || 'N/A'}\n調: ${settings.key || 'N/A'}`);
  };

  const handleNewUpload = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setShowAnalysis(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">楽譜自動解析</h1>
                <p className="text-gray-600 mt-2">
                  楽譜画像をアップロードして、テンポ・拍子・調などを自動検出します
                </p>
              </div>
              {selectedFile && (
                <button
                  onClick={handleNewUpload}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  新しい楽譜をアップロード
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          {!selectedFile && (
            <div className="max-w-2xl mx-auto">
              <SheetMusicUpload
                onFileSelect={handleFileSelect}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          )}

          {/* File Preview Section */}
          {selectedFile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Preview */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    楽譜プレビュー
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedFile.file.name} ({(selectedFile.file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
                <div className="p-6">
                  {selectedFile.preview ? (
                    <div className="flex justify-center">
                      <img
                        src={selectedFile.preview}
                        alt="楽譜プレビュー"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">プレビュー生成中...</p>
                    </div>
                  )}
                </div>
                
                {/* Analysis Trigger */}
                {!showAnalysis && (
                  <div className="p-6 border-t border-gray-200">
                    <button
                      onClick={() => handleAnalysisComplete}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      楽譜を解析開始
                    </button>
                  </div>
                )}
              </div>

              {/* Analysis Results */}
              {showAnalysis && analysis && (
                <SheetMusicAnalysisView
                  analysis={analysis}
                  onApplyToMetronome={handleApplyToMetronome}
                />
              )}
            </div>
          )}

          {/* Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              楽譜自動解析について
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">対応機能</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• テンポ記号の自動検出</li>
                  <li>• 拍子記号の認識</li>
                  <li>• 調号の判定</li>
                  <li>• 楽曲構成の分析</li>
                  <li>• 小節数のカウント</li>
                  <li>• 信頼度スコアの算出</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">使用方法</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. 楽譜画像（JPG、PNG）またはPDFをアップロード</li>
                  <li>2. 自動解析の実行</li>
                  <li>3. 解析結果の確認</li>
                  <li>4. メトロノーム設定への適用</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">注意:</span> 
                現在はプロトタイプ版です。解析精度は楽譜の品質や複雑さによって変動します。
                重要な設定は手動で確認・調整することをお勧めします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}