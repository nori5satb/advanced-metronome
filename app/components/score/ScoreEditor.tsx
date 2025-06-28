import { useState, useCallback } from 'react';

export interface DetectedSection {
  id: string;
  name: string;
  tempo: number;
  timeSignature: string;
  measures: number;
  startMeasure: number;
  endMeasure: number;
  confidence: number;
  isManuallyAdded?: boolean;
  isModified?: boolean;
}

export interface ScoreAnalysisResult {
  title: string;
  artist?: string;
  genre?: string;
  defaultTempo: number;
  defaultTimeSignature: string;
  confidence: number;
  sections: DetectedSection[];
}

interface ScoreEditorProps {
  analysisResult: ScoreAnalysisResult;
  onSave: (editedResult: ScoreAnalysisResult) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ScoreEditor({ 
  analysisResult, 
  onSave, 
  onCancel, 
  isLoading = false 
}: ScoreEditorProps) {
  const [editedResult, setEditedResult] = useState<ScoreAnalysisResult>(analysisResult);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateData = useCallback(() => {
    const errors: string[] = [];
    
    if (!editedResult.title.trim()) {
      errors.push('楽曲タイトルは必須です');
    }
    
    if (editedResult.defaultTempo < 30 || editedResult.defaultTempo > 300) {
      errors.push('デフォルトテンポは30-300の範囲で入力してください');
    }
    
    if (!['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '6/8', '7/8', '9/8', '12/8'].includes(editedResult.defaultTimeSignature)) {
      errors.push('デフォルト拍子が無効です');
    }
    
    editedResult.sections.forEach((section, index) => {
      if (!section.name.trim()) {
        errors.push(`セクション ${index + 1}: 名前は必須です`);
      }
      
      if (section.tempo < 30 || section.tempo > 300) {
        errors.push(`セクション "${section.name}": テンポは30-300の範囲で入力してください`);
      }
      
      if (section.measures < 1 || section.measures > 999) {
        errors.push(`セクション "${section.name}": 小節数は1-999の範囲で入力してください`);
      }
      
      if (section.startMeasure < 1 || section.endMeasure < section.startMeasure) {
        errors.push(`セクション "${section.name}": 小節範囲が無効です`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [editedResult]);

  const handleSave = useCallback(() => {
    if (validateData()) {
      onSave(editedResult);
    }
  }, [editedResult, validateData, onSave]);

  const handleSectionChange = useCallback((index: number, field: keyof DetectedSection, value: any) => {
    setEditedResult(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index 
          ? { ...section, [field]: value, isModified: true }
          : section
      )
    }));
  }, []);

  const handleAddSection = useCallback(() => {
    const newSection: DetectedSection = {
      id: crypto.randomUUID(),
      name: `新規セクション ${editedResult.sections.length + 1}`,
      tempo: editedResult.defaultTempo,
      timeSignature: editedResult.defaultTimeSignature,
      measures: 8,
      startMeasure: 1,
      endMeasure: 8,
      confidence: 1.0,
      isManuallyAdded: true
    };
    
    setEditedResult(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  }, [editedResult]);

  const handleDeleteSection = useCallback((index: number) => {
    setEditedResult(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">楽譜解析結果の編集</h1>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* バリデーションエラー */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold mb-2">入力エラー</h3>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 楽曲基本情報編集 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">楽曲基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
            <input
              type="text"
              value={editedResult.title}
              onChange={(e) => setEditedResult(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">アーティスト</label>
            <input
              type="text"
              value={editedResult.artist || ''}
              onChange={(e) => setEditedResult(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
            <input
              type="text"
              value={editedResult.genre || ''}
              onChange={(e) => setEditedResult(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">デフォルトテンポ (BPM) *</label>
            <input
              type="number"
              min="30"
              max="300"
              value={editedResult.defaultTempo}
              onChange={(e) => setEditedResult(prev => ({ ...prev, defaultTempo: parseInt(e.target.value) || 120 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">デフォルト拍子 *</label>
            <select
              value={editedResult.defaultTimeSignature}
              onChange={(e) => setEditedResult(prev => ({ ...prev, defaultTimeSignature: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="2/4">2/4</option>
              <option value="6/8">6/8</option>
              <option value="9/8">9/8</option>
              <option value="12/8">12/8</option>
            </select>
          </div>
        </div>
      </div>

      {/* セクション編集 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">セクション編集</h2>
          <button
            onClick={handleAddSection}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + セクション追加
          </button>
        </div>

        <div className="space-y-4">
          {editedResult.sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">セクション {index + 1}</h3>
                  {section.isManuallyAdded && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">手動追加</span>
                  )}
                  {section.isModified && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">編集済み</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSection(index)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">テンポ *</label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={section.tempo}
                    onChange={(e) => handleSectionChange(index, 'tempo', parseInt(e.target.value) || 120)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">拍子 *</label>
                  <select
                    value={section.timeSignature}
                    onChange={(e) => handleSectionChange(index, 'timeSignature', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="4/4">4/4</option>
                    <option value="3/4">3/4</option>
                    <option value="2/4">2/4</option>
                    <option value="6/8">6/8</option>
                    <option value="9/8">9/8</option>
                    <option value="12/8">12/8</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">小節数 *</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={section.measures}
                    onChange={(e) => handleSectionChange(index, 'measures', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始小節 *</label>
                  <input
                    type="number"
                    min="1"
                    value={section.startMeasure}
                    onChange={(e) => handleSectionChange(index, 'startMeasure', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">終了小節 *</label>
                  <input
                    type="number"
                    min="1"
                    value={section.endMeasure}
                    onChange={(e) => handleSectionChange(index, 'endMeasure', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                検出精度: {Math.round(section.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}