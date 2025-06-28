/**
 * パフォーマンス最適化関連のユーティリティ
 */

// Web Audio API最適化
export class OptimizedAudioContext {
  private static instance: OptimizedAudioContext | null = null;
  private audioContext: AudioContext | null = null;
  private gainNodes = new Map<string, GainNode>();
  private oscillatorPool: OscillatorNode[] = [];
  private readonly maxPoolSize = 10;

  static getInstance(): OptimizedAudioContext {
    if (!OptimizedAudioContext.instance) {
      OptimizedAudioContext.instance = new OptimizedAudioContext();
    }
    return OptimizedAudioContext.instance;
  }

  async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 低遅延設定
      if (this.audioContext.audioWorklet) {
        // AudioWorkletを使用して遅延を最小化
        try {
          const sampleRate = this.audioContext.sampleRate;
          const bufferSize = Math.min(256, sampleRate / 100); // 10ms以下を目標
          this.audioContext = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: sampleRate,
          });
        } catch (error) {
          console.warn('低遅延設定に失敗:', error);
        }
      }
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  // オシレータープールを使用してオブジェクト生成コストを削減
  async createOptimizedClick(frequency: number, volume: number, when: number): Promise<void> {
    const audioContext = await this.getAudioContext();
    
    let oscillator = this.oscillatorPool.pop();
    if (!oscillator) {
      oscillator = audioContext.createOscillator();
    }

    const gainNode = audioContext.createGain();
    
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.type = 'square'; // より軽量な波形
    
    // 最適化されたエンベロープ
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + 0.05); // より短い音
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(when);
    oscillator.stop(when + 0.05);
    
    // オシレータを再利用のためにプールに戻す
    oscillator.onended = () => {
      if (this.oscillatorPool.length < this.maxPoolSize) {
        oscillator.disconnect();
        this.oscillatorPool.push(oscillator);
      }
    };
  }

  getGainNode(id: string): GainNode | null {
    return this.gainNodes.get(id) || null;
  }

  setGainNode(id: string, gainNode: GainNode): void {
    this.gainNodes.set(id, gainNode);
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNodes.clear();
    this.oscillatorPool.forEach(osc => osc.disconnect());
    this.oscillatorPool = [];
  }
}

// デバウンス機能
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// スロットル機能
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// メモ化
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 遅延読み込み用ユーティリティ
export function lazyLoad<T>(factory: () => Promise<T>): () => Promise<T> {
  let instance: Promise<T> | null = null;
  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

// パフォーマンス測定
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static start(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      
      const measurements = this.measurements.get(label)!;
      measurements.push(duration);
      
      // 直近100回の測定値のみ保持
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  static getAverageTime(label: string): number {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static getStats(label: string): { avg: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }

  static logStats(): void {
    console.group('Performance Stats');
    for (const [label, measurements] of this.measurements) {
      const stats = this.getStats(label);
      console.log(`${label}:`, {
        average: `${stats.avg.toFixed(2)}ms`,
        min: `${stats.min.toFixed(2)}ms`,
        max: `${stats.max.toFixed(2)}ms`,
        samples: stats.count
      });
    }
    console.groupEnd();
  }
}

// リソース効率的なアニメーション
export function requestIdleCallback(callback: () => void, timeout = 5000): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    // フォールバック
    setTimeout(callback, 1);
  }
}

// 画像最適化
export function optimizeImage(url: string, width?: number, height?: number): string {
  // Cloudflare Images対応（実際の実装では環境に応じて調整）
  if (width || height) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('format', 'auto');
    params.set('quality', '85');
    
    return `${url}?${params.toString()}`;
  }
  return url;
}

// バンドルサイズ最適化のための動的インポート
export const lazyComponents = {
  SongManagement: lazyLoad(() => import('../components/song/SongManagementPage')),
  TempoScaling: lazyLoad(() => import('../components/tempo/TempoScalingPanel')),
  PracticeSession: lazyLoad(() => import('../components/metronome/PracticeSessionControls')),
};

// Web Vitals測定
export function measureWebVitals(): void {
  if (typeof window !== 'undefined') {
    // CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            console.log('Layout Shift:', (entry as any).value);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }
}