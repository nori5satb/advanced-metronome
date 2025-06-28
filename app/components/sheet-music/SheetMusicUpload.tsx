import type { ReactNode } from 'react';
import { useState, useCallback, useRef } from 'react';
import { SheetMusicManager } from '~/lib/sheet-music-manager';
import type { SheetMusicFile } from '~/lib/sheet-music-manager';

interface SheetMusicUploadProps {
  onFileSelect: (file: SheetMusicFile) => void;
  onAnalysisComplete?: (analysis: any) => void;
  disabled?: boolean;
  className?: string;
}

export default function SheetMusicUpload({ 
  onFileSelect, 
  onAnalysisComplete,
  disabled = false,
  className = ''
}: SheetMusicUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manager = new SheetMusicManager();

  const handleFileProcess = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file
      const validation = manager.validateFile(file);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Create preview
      const preview = await manager.createPreview(file);
      
      // Pass file to parent
      onFileSelect({ file, preview });

      // Optional: Start analysis immediately
      if (onAnalysisComplete) {
        // Note: In real app, userId would come from auth context
        const result = await manager.processSheetMusic(file, 'demo-user');
        onAnalysisComplete(result.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '楽譜処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  }, [manager, onFileSelect, onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileProcess(files[0]);
    }
  }, [disabled, isProcessing, handleFileProcess]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragOver(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  }, [handleFileProcess]);

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isProcessing]);

  const baseClasses = `
    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
    transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center
    ${className}
  `;

  const stateClasses = (() => {
    if (disabled || isProcessing) {
      return 'border-gray-300 bg-gray-50 cursor-not-allowed';
    }
    if (isDragOver) {
      return 'border-blue-500 bg-blue-50';
    }
    return 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50';
  })();

  return (
    <div className="space-y-4">
      <div
        className={`${baseClasses} ${stateClasses}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">楽譜を解析中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                楽譜をアップロード
              </p>
              <p className="text-sm text-gray-600">
                ファイルをドロップするか、クリックして選択してください
              </p>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>対応形式: JPG, PNG, PDF</p>
              <p>最大サイズ: 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}