import type { SheetMusicAnalysisResult } from './sheet-music-analysis';
import { SheetMusicAnalyzer } from './sheet-music-analysis';

export interface SheetMusicUpload {
  id: string;
  songId?: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  isProcessed: boolean;
  uploadedAt: number;
  processedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SheetMusicFile {
  file: File;
  preview?: string;
}

export class SheetMusicManager {
  private analyzer: SheetMusicAnalyzer;
  private readonly supportedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  constructor() {
    this.analyzer = new SheetMusicAnalyzer();
  }

  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`ファイルサイズが大きすぎます。最大${maxSize / 1024 / 1024}MBまで対応しています。`);
    }

    // Check MIME type
    if (!this.supportedMimeTypes.includes(file.type)) {
      errors.push(`対応していないファイル形式です。JPG、PNG、PDF形式をご利用ください。`);
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      errors.push('ファイル名が無効です。');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        // For PDFs, show a placeholder icon
        resolve('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12" fill="%236b7280">PDF</text></svg>');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async processSheetMusic(
    file: File, 
    userId: string, 
    songId?: string
  ): Promise<{ upload: SheetMusicUpload; analysis: SheetMusicAnalysisResult }> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`ファイル検証エラー: ${validation.errors.join(', ')}`);
    }

    // Create upload record
    const upload: SheetMusicUpload = {
      id: crypto.randomUUID(),
      songId,
      userId,
      fileName: file.name,
      filePath: `/uploads/sheet-music/${userId}/${Date.now()}-${file.name}`,
      fileSize: file.size,
      mimeType: file.type,
      isProcessed: false,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      // Analyze the sheet music
      const analysis = await this.analyzer.analyzeImage(file);
      analysis.sheetMusicId = upload.id;

      // Mark as processed
      upload.isProcessed = true;
      upload.processedAt = Date.now();
      upload.updatedAt = Date.now();

      return { upload, analysis };
    } catch (error) {
      throw new Error(`楽譜解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  async reprocessSheetMusic(sheetMusicId: string, file: File): Promise<SheetMusicAnalysisResult> {
    try {
      const analysis = await this.analyzer.analyzeImage(file);
      analysis.sheetMusicId = sheetMusicId;
      return analysis;
    } catch (error) {
      throw new Error(`楽譜再解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  getAnalysisQuality(analysis: SheetMusicAnalysisResult): 'excellent' | 'good' | 'fair' | 'poor' {
    const confidence = analysis.confidenceScore;
    const hasErrors = analysis.errorMessages.length > 0;

    if (hasErrors || confidence < 0.3) return 'poor';
    if (confidence < 0.5) return 'fair';
    if (confidence < 0.8) return 'good';
    return 'excellent';
  }

  getAnalysisQualityLabel(quality: string): string {
    switch (quality) {
      case 'excellent': return '優秀';
      case 'good': return '良好';
      case 'fair': return '普通';
      case 'poor': return '要改善';
      default: return '不明';
    }
  }

  getAnalysisQualityColor(quality: string): string {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  extractMetronomeSettings(analysis: SheetMusicAnalysisResult): {
    tempo?: number;
    timeSignature?: string;
    key?: string;
    confidence: number;
  } {
    return {
      tempo: analysis.detectedTempo,
      timeSignature: analysis.detectedTimeSignature,
      key: analysis.detectedKey,
      confidence: analysis.confidenceScore
    };
  }

  generateSectionData(analysis: SheetMusicAnalysisResult): Array<{
    name: string;
    tempo?: number;
    timeSignature?: string;
    measures: number;
    startMeasure: number;
    endMeasure: number;
  }> {
    return analysis.sections.map(section => ({
      name: this.getSectionDisplayName(section.type),
      tempo: section.tempo || analysis.detectedTempo,
      timeSignature: section.timeSignature || analysis.detectedTimeSignature,
      measures: section.endMeasure - section.startMeasure + 1,
      startMeasure: section.startMeasure,
      endMeasure: section.endMeasure
    }));
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

  // Helper method to check if a file appears to be sheet music
  async isLikelySheetMusic(file: File): Promise<boolean> {
    if (!this.validateFile(file).isValid) {
      return false;
    }

    // Basic heuristics - in a real app, this could use ML
    const fileName = file.name.toLowerCase();
    const sheetMusicKeywords = ['score', 'sheet', 'music', '楽譜', 'score'];
    
    return sheetMusicKeywords.some(keyword => fileName.includes(keyword));
  }
}