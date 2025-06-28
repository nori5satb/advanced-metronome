import type { Section } from './songs';

export interface TempoAdjustment {
  sectionId: string;
  originalTempo: number;
  newTempo: number;
  isExcluded: boolean;
}

export interface TempoScalingState {
  scaling: number;
  adjustments: TempoAdjustment[];
  isPreviewMode: boolean;
  savedState?: TempoScalingState;
}

export class TempoScalingEngine {
  constructor() {}

  /**
   * テンポスケーリングの計算
   */
  calculateScaledTempo(originalTempo: number, scaling: number): number {
    const scaledTempo = Math.round(originalTempo * scaling);
    // 30-300 BPMの範囲内に制限
    return Math.max(30, Math.min(300, scaledTempo));
  }

  /**
   * セクション一覧に対するテンポ調整を計算
   */
  calculateAdjustments(
    sections: Section[], 
    scaling: number, 
    excludedSectionIds: Set<string> = new Set()
  ): TempoAdjustment[] {
    return sections.map(section => ({
      sectionId: section.id,
      originalTempo: section.tempo,
      newTempo: excludedSectionIds.has(section.id) 
        ? section.tempo 
        : this.calculateScaledTempo(section.tempo, scaling),
      isExcluded: excludedSectionIds.has(section.id)
    }));
  }

  /**
   * スケーリング値の検証
   */
  validateScaling(scaling: number): boolean {
    return scaling >= 0.5 && scaling <= 2.0;
  }

  /**
   * 適用可能な調整かどうかを確認
   */
  validateAdjustments(adjustments: TempoAdjustment[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const adjustment of adjustments) {
      if (!adjustment.isExcluded) {
        if (adjustment.newTempo < 30) {
          errors.push(`セクション${adjustment.sectionId}: 最小テンポ30 BPMを下回ります`);
        }
        if (adjustment.newTempo > 300) {
          errors.push(`セクション${adjustment.sectionId}: 最大テンポ300 BPMを上回ります`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 調整の統計情報を計算
   */
  calculateStatistics(adjustments: TempoAdjustment[]): {
    totalSections: number;
    adjustedSections: number;
    excludedSections: number;
    averageOriginalTempo: number;
    averageNewTempo: number;
    tempoRange: {
      original: { min: number; max: number };
      new: { min: number; max: number };
    };
  } {
    const totalSections = adjustments.length;
    const adjustedSections = adjustments.filter(a => !a.isExcluded).length;
    const excludedSections = adjustments.filter(a => a.isExcluded).length;

    const originalTempos = adjustments.map(a => a.originalTempo);
    const newTempos = adjustments.filter(a => !a.isExcluded).map(a => a.newTempo);
    const allNewTempos = adjustments.map(a => a.newTempo);

    const averageOriginalTempo = originalTempos.reduce((sum, tempo) => sum + tempo, 0) / totalSections;
    const averageNewTempo = allNewTempos.reduce((sum, tempo) => sum + tempo, 0) / totalSections;

    return {
      totalSections,
      adjustedSections,
      excludedSections,
      averageOriginalTempo: Math.round(averageOriginalTempo),
      averageNewTempo: Math.round(averageNewTempo),
      tempoRange: {
        original: {
          min: Math.min(...originalTempos),
          max: Math.max(...originalTempos)
        },
        new: {
          min: Math.min(...allNewTempos),
          max: Math.max(...allNewTempos)
        }
      }
    };
  }

  /**
   * プリセットスケーリング値
   */
  getPresetScalings(): Array<{ value: number; label: string; description: string }> {
    return [
      { value: 0.5, label: '1/2倍速', description: '半分の速度' },
      { value: 0.7, label: '0.7倍速', description: 'ゆっくり練習' },
      { value: 0.8, label: '0.8倍速', description: '少し遅め' },
      { value: 0.9, label: '0.9倍速', description: 'わずかに遅め' },
      { value: 1.0, label: '等倍速', description: '変更なし' },
      { value: 1.1, label: '1.1倍速', description: 'わずかに速め' },
      { value: 1.2, label: '1.2倍速', description: '少し速め' },
      { value: 1.5, label: '1.5倍速', description: '速い練習' },
      { value: 2.0, label: '2倍速', description: '倍の速度' }
    ];
  }

  /**
   * 調整の差分を計算
   */
  calculateDifferences(adjustments: TempoAdjustment[]): Array<{
    sectionId: string;
    difference: number;
    percentageChange: number;
  }> {
    return adjustments.map(adjustment => {
      const difference = adjustment.newTempo - adjustment.originalTempo;
      const percentageChange = adjustment.isExcluded 
        ? 0 
        : ((adjustment.newTempo - adjustment.originalTempo) / adjustment.originalTempo) * 100;
      
      return {
        sectionId: adjustment.sectionId,
        difference,
        percentageChange: Math.round(percentageChange * 10) / 10
      };
    });
  }
}

// グローバルインスタンス
let tempoScalingInstance: TempoScalingEngine | null = null;

export function getTempoScalingInstance(): TempoScalingEngine {
  if (!tempoScalingInstance) {
    tempoScalingInstance = new TempoScalingEngine();
  }
  return tempoScalingInstance;
}