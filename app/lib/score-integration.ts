/**
 * 楽譜解析結果とメトロノーム機能の統合ライブラリ
 */

import type { ScoreAnalysisResult, DetectedSection } from '../components/score/ScoreEditor';
import type { NewSong, NewSection } from './songs';

export interface ConversionOptions {
  userId?: string;
  overrideExisting?: boolean;
  validateData?: boolean;
  autoOrderSections?: boolean;
}

export interface ConversionResult {
  song: NewSong;
  sections: NewSection[];
  warnings: string[];
  errors: string[];
}

/**
 * 楽譜解析結果を楽曲・セクションデータに変換
 */
export function convertScoreToSongData(
  analysisResult: ScoreAnalysisResult,
  options: ConversionOptions = {}
): ConversionResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // 楽曲データの生成
  const songId = crypto.randomUUID();
  const song: NewSong = {
    id: songId,
    userId: options.userId,
    title: analysisResult.title || '無題の楽曲',
    artist: analysisResult.artist,
    genre: analysisResult.genre,
    defaultTempo: analysisResult.defaultTempo,
    defaultTimeSignature: analysisResult.defaultTimeSignature,
    isPublic: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // バリデーション
  if (options.validateData) {
    if (!song.title.trim()) {
      errors.push('楽曲タイトルが空です');
    }
    
    if (song.defaultTempo && (song.defaultTempo < 30 || song.defaultTempo > 300)) {
      errors.push('デフォルトテンポが有効範囲外です (30-300 BPM)');
    }
  }

  // セクションデータの生成
  const sections: NewSection[] = [];
  
  analysisResult.sections.forEach((detectedSection, index) => {
    try {
      const section: NewSection = {
        id: crypto.randomUUID(),
        songId: songId,
        name: detectedSection.name || `セクション ${index + 1}`,
        tempo: detectedSection.tempo,
        timeSignature: detectedSection.timeSignature,
        measures: detectedSection.measures,
        order: options.autoOrderSections ? index + 1 : detectedSection.startMeasure,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // セクションのバリデーション
      if (options.validateData) {
        if (section.tempo < 30 || section.tempo > 300) {
          warnings.push(`セクション "${section.name}" のテンポが有効範囲外です`);
          section.tempo = Math.max(30, Math.min(300, section.tempo));
        }

        if (section.measures < 1 || section.measures > 999) {
          warnings.push(`セクション "${section.name}" の小節数が有効範囲外です`);
          section.measures = Math.max(1, Math.min(999, section.measures));
        }

        if (!['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '6/8', '7/8', '9/8', '12/8'].includes(section.timeSignature)) {
          warnings.push(`セクション "${section.name}" の拍子が無効です。4/4に設定されました`);
          section.timeSignature = '4/4';
        }
      }

      // 信頼度による警告
      if (detectedSection.confidence < 0.6) {
        warnings.push(`セクション "${section.name}" の検出精度が低いため、手動確認を推奨します`);
      }

      sections.push(section);
    } catch (error) {
      errors.push(`セクション "${detectedSection.name}" の変換中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // セクション順序の検証
  if (options.autoOrderSections && sections.length > 1) {
    sections.sort((a, b) => a.order - b.order);
    
    // 重複した順序の修正
    sections.forEach((section, index) => {
      section.order = index + 1;
    });
  }

  return {
    song,
    sections,
    warnings,
    errors
  };
}

/**
 * 楽譜解析結果の品質を評価
 */
export function evaluateAnalysisQuality(analysisResult: ScoreAnalysisResult): {
  overallScore: number;
  categoryScores: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  
  // 基本情報の完全性
  const basicInfoScore = calculateBasicInfoScore(analysisResult);
  
  // セクション検出の品質
  const sectionsScore = calculateSectionsScore(analysisResult.sections);
  
  // 一貫性チェック
  const consistencyScore = calculateConsistencyScore(analysisResult);
  
  const categoryScores = {
    basicInfo: basicInfoScore,
    sections: sectionsScore,
    consistency: consistencyScore
  };
  
  const overallScore = (basicInfoScore + sectionsScore + consistencyScore) / 3;

  // 推奨事項の生成
  if (basicInfoScore < 0.7) {
    recommendations.push('楽曲の基本情報（タイトル、アーティスト等）を確認してください');
  }
  
  if (sectionsScore < 0.7) {
    recommendations.push('セクションの検出精度が低いため、手動で確認・修正することを推奨します');
  }
  
  if (consistencyScore < 0.7) {
    recommendations.push('テンポや拍子の一貫性に問題があります。セクション間の設定を確認してください');
  }
  
  if (analysisResult.sections.length === 0) {
    recommendations.push('セクションが検出されていません。手動でセクションを追加してください');
  }
  
  if (analysisResult.sections.some(s => s.confidence < 0.5)) {
    recommendations.push('信頼度の低いセクションがあります。該当セクションを手動で確認してください');
  }

  return {
    overallScore,
    categoryScores,
    recommendations
  };
}

function calculateBasicInfoScore(result: ScoreAnalysisResult): number {
  let score = 0;
  let totalPoints = 5;
  
  // タイトルの存在（必須）
  if (result.title && result.title.trim().length > 0) {
    score += 2;
  }
  
  // アーティストの存在
  if (result.artist && result.artist.trim().length > 0) {
    score += 1;
  }
  
  // テンポの妥当性
  if (result.defaultTempo >= 30 && result.defaultTempo <= 300) {
    score += 1;
  }
  
  // 拍子の妥当性
  if (['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '6/8', '7/8', '9/8', '12/8'].includes(result.defaultTimeSignature)) {
    score += 1;
  }
  
  return score / totalPoints;
}

function calculateSectionsScore(sections: DetectedSection[]): number {
  if (sections.length === 0) return 0;
  
  let totalScore = 0;
  
  sections.forEach(section => {
    let sectionScore = 0;
    let maxScore = 4;
    
    // 信頼度
    sectionScore += section.confidence;
    
    // 名前の妥当性
    if (section.name && section.name.trim().length > 0) {
      sectionScore += 1;
    }
    
    // テンポの妥当性
    if (section.tempo >= 30 && section.tempo <= 300) {
      sectionScore += 1;
    }
    
    // 小節数の妥当性
    if (section.measures >= 1 && section.measures <= 999) {
      sectionScore += 1;
    }
    
    totalScore += sectionScore / maxScore;
  });
  
  return totalScore / sections.length;
}

function calculateConsistencyScore(result: ScoreAnalysisResult): number {
  if (result.sections.length <= 1) return 1;
  
  let consistencyScore = 1;
  
  // テンポの一貫性チェック
  const tempos = result.sections.map(s => s.tempo);
  const tempoVariance = calculateVariance(tempos);
  const avgTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length;
  
  if (tempoVariance / (avgTempo * avgTempo) > 0.1) {
    consistencyScore -= 0.3; // テンポが大きく異なる場合
  }
  
  // 拍子の一貫性チェック
  const timeSignatures = result.sections.map(s => s.timeSignature);
  const uniqueTimeSignatures = [...new Set(timeSignatures)];
  
  if (uniqueTimeSignatures.length > 2) {
    consistencyScore -= 0.2; // 拍子が頻繁に変わる場合
  }
  
  // 小節範囲の重複チェック
  const hasOverlap = checkMeasureOverlap(result.sections);
  if (hasOverlap) {
    consistencyScore -= 0.3;
  }
  
  return Math.max(0, consistencyScore);
}

function calculateVariance(numbers: number[]): number {
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

function checkMeasureOverlap(sections: DetectedSection[]): boolean {
  const sortedSections = [...sections].sort((a, b) => a.startMeasure - b.startMeasure);
  
  for (let i = 0; i < sortedSections.length - 1; i++) {
    const current = sortedSections[i];
    const next = sortedSections[i + 1];
    
    if (current.endMeasure >= next.startMeasure) {
      return true; // 重複あり
    }
  }
  
  return false;
}

/**
 * メトロノーム練習用の推奨設定を生成
 */
export function generatePracticeRecommendations(analysisResult: ScoreAnalysisResult): {
  tempoProgression: { name: string; tempo: number; description: string }[];
  practiceOrder: { sectionName: string; priority: number; reason: string }[];
  countInSettings: { beats: number; volume: number };
} {
  const sections = analysisResult.sections;
  
  // テンポ段階的練習の推奨
  const maxTempo = Math.max(...sections.map(s => s.tempo));
  const minTempo = Math.min(...sections.map(s => s.tempo));
  
  const tempoProgression = [
    {
      name: '基礎練習',
      tempo: Math.max(60, Math.round(minTempo * 0.7)),
      description: '正確性重視で基本テンポより遅く'
    },
    {
      name: '中間練習',
      tempo: Math.round((minTempo + maxTempo) / 2),
      description: '中間テンポでフレーズの流れを確認'
    },
    {
      name: '実用練習',
      tempo: Math.round(maxTempo * 0.9),
      description: '本来のテンポに近い速度で'
    },
    {
      name: '本番テンポ',
      tempo: maxTempo,
      description: '楽譜通りの速度で演奏'
    }
  ];

  // 練習順序の推奨（難易度と重要度考慮）
  const practiceOrder = sections
    .map(section => {
      let priority = 5; // 基本優先度
      let reason = '';
      
      // テンポが遅い = 基礎的 = 高優先度
      if (section.tempo < minTempo + (maxTempo - minTempo) * 0.3) {
        priority += 2;
        reason += '基礎的なテンポのため、';
      }
      
      // 信頼度が低い = 要確認 = 高優先度
      if (section.confidence < 0.7) {
        priority += 3;
        reason += '検出精度が低く要確認のため、';
      }
      
      // 小節数が多い = 重要 = 高優先度
      if (section.measures > 8) {
        priority += 1;
        reason += '長いセクションで重要なため、';
      }
      
      reason = reason.replace(/、$/, '');
      if (!reason) reason = '標準的な練習セクション';
      
      return {
        sectionName: section.name,
        priority,
        reason
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // カウントイン設定の推奨
  const averageTimeSignature = sections.reduce((acc, section) => {
    const numerator = parseInt(section.timeSignature.split('/')[0]);
    return acc + numerator;
  }, 0) / sections.length;
  
  const countInSettings = {
    beats: Math.round(averageTimeSignature) || 4,
    volume: 0.6 // セクション練習では控えめに
  };

  return {
    tempoProgression,
    practiceOrder,
    countInSettings
  };
}