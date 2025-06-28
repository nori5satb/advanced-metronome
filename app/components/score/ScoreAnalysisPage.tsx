import { useState, useCallback, useEffect } from 'react';
import ScoreEditor, { type ScoreAnalysisResult } from './ScoreEditor';
import { convertScoreToSongData, evaluateAnalysisQuality, generatePracticeRecommendations } from '../../lib/score-integration';
import { SongRepository } from '../../lib/songs';
import { useAuth } from '../auth/AuthContext';

interface ScoreAnalysisPageProps {
  className?: string;
}

export default function ScoreAnalysisPage({ className = '' }: ScoreAnalysisPageProps) {
  const { user } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<ScoreAnalysisResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // モック分析結果（実際にはworker1とworker2の機能から取得）
  useEffect(() => {
    // デモ用の分析結果
    const mockResult: ScoreAnalysisResult = {
      title: "春の歌",
      artist: "サンプルアーティスト",
      genre: "クラシック",
      defaultTempo: 120,
      defaultTimeSignature: "4/4",
      confidence: 0.85,
      sections: [
        {
          id: "intro",
          name: "イントロ",
          tempo: 100,
          timeSignature: "4/4",
          measures: 8,
          startMeasure: 1,
          endMeasure: 8,
          confidence: 0.9
        },
        {
          id: "verse1",
          name: "Aメロ",
          tempo: 120,
          timeSignature: "4/4",
          measures: 16,
          startMeasure: 9,
          endMeasure: 24,
          confidence: 0.8
        },
        {
          id: "chorus1",
          name: "サビ",
          tempo: 130,
          timeSignature: "4/4",
          measures: 16,
          startMeasure: 25,
          endMeasure: 40,
          confidence: 0.75
        },
        {
          id: "bridge",
          name: "ブリッジ",
          tempo: 110,
          timeSignature: "3/4",
          measures: 8,
          startMeasure: 41,
          endMeasure: 48,
          confidence: 0.6
        }
      ]
    };
    setAnalysisResult(mockResult);
  }, []);

  const handleSave = useCallback(async (editedResult: ScoreAnalysisResult) => {
    if (!user) {
      setError('ログインが必要です');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 楽譜解析結果を楽曲データに変換
      const conversionResult = convertScoreToSongData(editedResult, {
        userId: user.id,
        validateData: true,
        autoOrderSections: true
      });

      if (conversionResult.errors.length > 0) {
        throw new Error(`データ変換エラー: ${conversionResult.errors.join(', ')}`);
      }

      // データベースに保存（実際の実装では適切なAPIコールを行う）
      const formData = new FormData();
      formData.append('_method', 'POST');
      formData.append('title', conversionResult.song.title);
      formData.append('artist', conversionResult.song.artist || '');
      formData.append('genre', conversionResult.song.genre || '');
      formData.append('defaultTempo', conversionResult.song.defaultTempo?.toString() || '');
      formData.append('defaultTimeSignature', conversionResult.song.defaultTimeSignature || '');

      const songResponse = await fetch('/api/songs', {
        method: 'POST',
        body: formData
      });

      if (!songResponse.ok) {
        throw new Error('楽曲の保存に失敗しました');
      }

      const savedSong = await songResponse.json() as { id: string };

      // セクションを保存
      for (const section of conversionResult.sections) {
        const sectionFormData = new FormData();
        sectionFormData.append('_method', 'POST');
        sectionFormData.append('name', section.name);
        sectionFormData.append('tempo', section.tempo.toString());
        sectionFormData.append('timeSignature', section.timeSignature);
        sectionFormData.append('measures', (section.measures || 1).toString());
        sectionFormData.append('order', section.order.toString());

        const sectionResponse = await fetch(`/api/songs/${savedSong.id}/sections`, {
          method: 'POST',
          body: sectionFormData
        });

        if (!sectionResponse.ok) {
          console.warn(`セクション "${section.name}" の保存に失敗しました`);
        }
      }

      setAnalysisResult(editedResult);
      setIsEditing(false);
      setSuccess(`楽曲 "${editedResult.title}" を正常に保存しました`);
      
      // 警告があれば表示
      if (conversionResult.warnings.length > 0) {
        console.warn('変換時の警告:', conversionResult.warnings);
      }

    } catch (error) {
      console.error('保存エラー:', error);
      setError(error instanceof Error ? error.message : '保存中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  if (!analysisResult) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">楽譜を解析中...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <ScoreEditor
        analysisResult={analysisResult}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  const qualityEvaluation = evaluateAnalysisQuality(analysisResult);
  const practiceRecommendations = generatePracticeRecommendations(analysisResult);

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">楽譜解析結果</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          編集
        </button>
      </div>

      {/* メッセージ表示 */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* 品質評価 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">解析品質評価</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              qualityEvaluation.overallScore >= 0.8 ? 'text-green-600' :
              qualityEvaluation.overallScore >= 0.6 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(qualityEvaluation.overallScore * 100)}%
            </div>
            <div className="text-sm text-gray-600">総合評価</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700 mb-2">
              {Math.round(qualityEvaluation.categoryScores.basicInfo * 100)}%
            </div>
            <div className="text-sm text-gray-600">基本情報</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700 mb-2">
              {Math.round(qualityEvaluation.categoryScores.sections * 100)}%
            </div>
            <div className="text-sm text-gray-600">セクション検出</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700 mb-2">
              {Math.round(qualityEvaluation.categoryScores.consistency * 100)}%
            </div>
            <div className="text-sm text-gray-600">一貫性</div>
          </div>
        </div>

        {qualityEvaluation.recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">改善推奨事項</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              {qualityEvaluation.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 楽曲情報 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">楽曲情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">タイトル</span>
            <div className="font-semibold">{analysisResult.title}</div>
          </div>
          {analysisResult.artist && (
            <div>
              <span className="text-sm text-gray-600">アーティスト</span>
              <div className="font-semibold">{analysisResult.artist}</div>
            </div>
          )}
          {analysisResult.genre && (
            <div>
              <span className="text-sm text-gray-600">ジャンル</span>
              <div className="font-semibold">{analysisResult.genre}</div>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-600">デフォルトテンポ</span>
            <div className="font-semibold">{analysisResult.defaultTempo} BPM</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">デフォルト拍子</span>
            <div className="font-semibold">{analysisResult.defaultTimeSignature}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">検出精度</span>
            <div className="font-semibold">{Math.round(analysisResult.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* セクション一覧 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          検出されたセクション ({analysisResult.sections.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">セクション名</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">テンポ</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">拍子</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">小節数</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">範囲</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">精度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysisResult.sections.map((section, index) => (
                <tr key={section.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{section.name}</span>
                      {section.isManuallyAdded && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">手動追加</span>
                      )}
                      {section.isModified && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">編集済み</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">{section.tempo} BPM</td>
                  <td className="px-4 py-2">{section.timeSignature}</td>
                  <td className="px-4 py-2">{section.measures}</td>
                  <td className="px-4 py-2">{section.startMeasure} - {section.endMeasure}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      section.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                      section.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(section.confidence * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 練習推奨設定 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">練習推奨設定</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* テンポ段階練習 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">推奨テンポ進行</h3>
            <div className="space-y-2">
              {practiceRecommendations.tempoProgression.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{stage.name}</div>
                    <div className="text-sm text-gray-600">{stage.description}</div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {stage.tempo} BPM
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 練習順序 */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">推奨練習順序</h3>
            <div className="space-y-2">
              {practiceRecommendations.practiceOrder.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium">{item.sectionName}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 ml-8">{item.reason}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    優先度: {item.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* カウントイン推奨設定 */}
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="text-lg font-medium text-blue-800 mb-2">カウントイン推奨設定</h3>
          <div className="flex items-center gap-4 text-blue-700">
            <span>拍数: {practiceRecommendations.countInSettings.beats}拍</span>
            <span>音量: {Math.round(practiceRecommendations.countInSettings.volume * 100)}%</span>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsEditing(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          結果を編集
        </button>
        <button
          onClick={() => {
            // メトロノームページに移動（実装時に適切なナビゲーションを追加）
            window.location.href = '/metronome';
          }}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          メトロノームで練習
        </button>
      </div>
    </div>
  );
}