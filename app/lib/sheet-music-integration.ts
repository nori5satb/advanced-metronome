import type { SheetMusicAnalysisResult } from './sheet-music-analysis';
import type { MetronomeSettings } from './metronome';
import { getMetronomeInstance } from './metronome';

export interface SheetMusicMetronomeSettings {
  tempo?: number;
  timeSignature?: string;
  key?: string;
  sections?: Array<{
    name: string;
    startMeasure: number;
    endMeasure: number;
    tempo?: number;
    timeSignature?: string;
  }>;
  confidence: number;
}

export class SheetMusicIntegration {
  private metronome = getMetronomeInstance();

  extractMetronomeSettings(analysis: SheetMusicAnalysisResult): SheetMusicMetronomeSettings {
    const sections = analysis.sections.map(section => ({
      name: this.getSectionDisplayName(section.type),
      startMeasure: section.startMeasure,
      endMeasure: section.endMeasure,
      tempo: section.tempo || analysis.detectedTempo,
      timeSignature: section.timeSignature || analysis.detectedTimeSignature
    }));

    return {
      tempo: analysis.detectedTempo,
      timeSignature: analysis.detectedTimeSignature,
      key: analysis.detectedKey,
      sections,
      confidence: analysis.confidenceScore
    };
  }

  applyToMetronome(settings: SheetMusicMetronomeSettings): {
    success: boolean;
    appliedSettings: Partial<MetronomeSettings>;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const appliedSettings: Partial<MetronomeSettings> = {};

    try {
      // Apply tempo
      if (settings.tempo && settings.tempo >= 30 && settings.tempo <= 300) {
        this.metronome.setBpm(settings.tempo);
        appliedSettings.bpm = settings.tempo;
      } else if (settings.tempo) {
        warnings.push(`テンポ ${settings.tempo} BPMは範囲外です（30-300 BPM）`);
      }

      // Apply time signature
      if (settings.timeSignature) {
        const timeSignatureParts = this.parseTimeSignature(settings.timeSignature);
        if (timeSignatureParts) {
          this.metronome.setTimeSignature(timeSignatureParts.numerator, timeSignatureParts.denominator);
          appliedSettings.timeSignatureNumerator = timeSignatureParts.numerator;
          appliedSettings.timeSignatureDenominator = timeSignatureParts.denominator;
        } else {
          warnings.push(`拍子記号 "${settings.timeSignature}" を解析できませんでした`);
        }
      }

      // Setup practice sessions for sections
      if (settings.sections && settings.sections.length > 0) {
        // For now, set loop to the first section
        const firstSection = settings.sections[0];
        if (firstSection) {
          this.metronome.setLoopEnabled(true);
          this.metronome.setLoopRange(firstSection.startMeasure, firstSection.endMeasure);
          appliedSettings.loopEnabled = true;
          appliedSettings.loopStartMeasure = firstSection.startMeasure;
          appliedSettings.loopEndMeasure = firstSection.endMeasure;
        }
      }

      // Add confidence warning if low
      if (settings.confidence < 0.7) {
        warnings.push(`解析の信頼度が低いです（${Math.round(settings.confidence * 100)}%）。設定を手動で確認してください。`);
      }

      return {
        success: true,
        appliedSettings,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        appliedSettings,
        warnings: [...warnings, error instanceof Error ? error.message : '設定適用中にエラーが発生しました']
      };
    }
  }

  createPracticeSession(
    analysis: SheetMusicAnalysisResult,
    sectionIndex: number
  ): {
    success: boolean;
    sessionName: string;
    settings: Partial<MetronomeSettings>;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (sectionIndex >= analysis.sections.length) {
      return {
        success: false,
        sessionName: '',
        settings: {},
        warnings: ['指定されたセクションが見つかりません']
      };
    }

    const section = analysis.sections[sectionIndex];
    const sessionName = `${this.getSectionDisplayName(section.type)} (小節 ${section.startMeasure}-${section.endMeasure})`;
    
    try {
      const settings: Partial<MetronomeSettings> = {};

      // Set tempo
      const tempo = section.tempo || analysis.detectedTempo;
      if (tempo) {
        this.metronome.setBpm(tempo);
        settings.bpm = tempo;
      }

      // Set time signature
      const timeSignature = section.timeSignature || analysis.detectedTimeSignature;
      if (timeSignature) {
        const timeSignatureParts = this.parseTimeSignature(timeSignature);
        if (timeSignatureParts) {
          this.metronome.setTimeSignature(timeSignatureParts.numerator, timeSignatureParts.denominator);
          settings.timeSignatureNumerator = timeSignatureParts.numerator;
          settings.timeSignatureDenominator = timeSignatureParts.denominator;
        }
      }

      // Set loop for this section
      this.metronome.setLoopEnabled(true);
      this.metronome.setLoopRange(section.startMeasure, section.endMeasure);
      settings.loopEnabled = true;
      settings.loopStartMeasure = section.startMeasure;
      settings.loopEndMeasure = section.endMeasure;

      // Add confidence warning
      if (section.confidence < 0.7) {
        warnings.push(`このセクションの解析信頼度が低いです（${Math.round(section.confidence * 100)}%）`);
      }

      return {
        success: true,
        sessionName,
        settings,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        sessionName,
        settings: {},
        warnings: [...warnings, error instanceof Error ? error.message : 'セッション作成中にエラーが発生しました']
      };
    }
  }

  generateMetronomePresets(analysis: SheetMusicAnalysisResult): Array<{
    name: string;
    description: string;
    settings: Partial<MetronomeSettings>;
    confidence: number;
  }> {
    const presets: Array<{
      name: string;
      description: string;
      settings: Partial<MetronomeSettings>;
      confidence: number;
    }> = [];

    // Main preset with detected settings
    if (analysis.detectedTempo || analysis.detectedTimeSignature) {
      const settings: Partial<MetronomeSettings> = {};
      
      if (analysis.detectedTempo) {
        settings.bpm = analysis.detectedTempo;
      }
      
      if (analysis.detectedTimeSignature) {
        const timeSignatureParts = this.parseTimeSignature(analysis.detectedTimeSignature);
        if (timeSignatureParts) {
          settings.timeSignatureNumerator = timeSignatureParts.numerator;
          settings.timeSignatureDenominator = timeSignatureParts.denominator;
        }
      }

      presets.push({
        name: '基本設定',
        description: `楽譜から検出された基本的なメトロノーム設定`,
        settings,
        confidence: Math.max(analysis.tempoConfidence || 0, analysis.timeSignatureConfidence || 0)
      });
    }

    // Section-based presets
    analysis.sections.forEach((section, index) => {
      const settings: Partial<MetronomeSettings> = {
        loopEnabled: true,
        loopStartMeasure: section.startMeasure,
        loopEndMeasure: section.endMeasure
      };

      if (section.tempo) {
        settings.bpm = section.tempo;
      } else if (analysis.detectedTempo) {
        settings.bpm = analysis.detectedTempo;
      }

      const timeSignature = section.timeSignature || analysis.detectedTimeSignature;
      if (timeSignature) {
        const timeSignatureParts = this.parseTimeSignature(timeSignature);
        if (timeSignatureParts) {
          settings.timeSignatureNumerator = timeSignatureParts.numerator;
          settings.timeSignatureDenominator = timeSignatureParts.denominator;
        }
      }

      presets.push({
        name: this.getSectionDisplayName(section.type),
        description: `小節 ${section.startMeasure}-${section.endMeasure} (${section.endMeasure - section.startMeasure + 1}小節)`,
        settings,
        confidence: section.confidence
      });
    });

    return presets;
  }

  private parseTimeSignature(timeSignature: string): { numerator: number; denominator: number } | null {
    const match = timeSignature.match(/(\d+)\/(\d+)/);
    if (match) {
      const numerator = parseInt(match[1], 10);
      const denominator = parseInt(match[2], 10);
      
      // Validate values
      if (numerator >= 1 && numerator <= 12 && [1, 2, 4, 8, 16].includes(denominator)) {
        return { numerator, denominator };
      }
    }
    return null;
  }

  private getSectionDisplayName(type: string): string {
    switch (type) {
      case 'intro': return 'イントロ';
      case 'verse': return 'ヴァース';
      case 'chorus': return 'コーラス';
      case 'bridge': return 'ブリッジ';
      case 'outro': return 'アウトロ';
      case 'instrumental': return 'インストゥルメンタル';
      default: return 'セクション';
    }
  }

  // Utility methods for validation
  isValidTempo(tempo: number): boolean {
    return tempo >= 30 && tempo <= 300;
  }

  isValidTimeSignature(timeSignature: string): boolean {
    return this.parseTimeSignature(timeSignature) !== null;
  }

  getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  getConfidenceLevelLabel(level: string): string {
    switch (level) {
      case 'high': return '高い';
      case 'medium': return '中程度';
      case 'low': return '低い';
      default: return '不明';
    }
  }

  getConfidenceLevelColor(level: string): string {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}