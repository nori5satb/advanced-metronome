export interface MetronomeSettings {
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  volume: number;
  isPlaying: boolean;
}

export interface BeatInfo {
  beat: number;
  measure: number;
  isDownbeat: boolean;
  timestamp: number;
}

export type MetronomeEventType = 'beat' | 'start' | 'stop' | 'settingsChange';

export interface MetronomeEvent {
  type: MetronomeEventType;
  data?: BeatInfo | MetronomeSettings;
}

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private nextBeatTime = 0;
  private currentBeat = 0;
  private currentMeasure = 1;
  private timerId: number | null = null;
  
  private settings: MetronomeSettings = {
    bpm: 120,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    volume: 0.7,
    isPlaying: false
  };

  private eventListeners: Map<MetronomeEventType, ((event: MetronomeEvent) => void)[]> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required for mobile browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Web Audio API is not supported in this browser');
    }
  }

  private createClickSound(isDownbeat: boolean, when: number): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Different frequencies for downbeat and regular beats
    oscillator.frequency.setValueAtTime(
      isDownbeat ? 880 : 440, // A5 for downbeat, A4 for regular beats
      when
    );

    // Sharp click envelope
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(this.settings.volume, when + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(when);
    oscillator.stop(when + 0.1);
  }

  private scheduleBeats(): void {
    if (!this.audioContext || !this.isPlaying) return;

    const currentTime = this.audioContext.currentTime;
    const lookahead = 0.025; // 25ms lookahead
    
    while (this.nextBeatTime < currentTime + lookahead) {
      const isDownbeat = this.currentBeat % this.settings.timeSignatureNumerator === 0;
      
      // Schedule the audio
      this.createClickSound(isDownbeat, this.nextBeatTime);
      
      // Emit beat event
      this.emitEvent('beat', {
        beat: (this.currentBeat % this.settings.timeSignatureNumerator) + 1,
        measure: this.currentMeasure,
        isDownbeat,
        timestamp: this.nextBeatTime
      });

      // Calculate next beat time
      const beatInterval = 60.0 / this.settings.bpm;
      this.nextBeatTime += beatInterval;
      
      // Advance beat counter
      this.currentBeat++;
      if (this.currentBeat % this.settings.timeSignatureNumerator === 0) {
        this.currentMeasure++;
      }
    }

    // Schedule next scheduling call
    this.timerId = window.setTimeout(() => this.scheduleBeats(), 10);
  }

  private emitEvent(type: MetronomeEventType, data?: BeatInfo | MetronomeSettings): void {
    const listeners = this.eventListeners.get(type) || [];
    const event: MetronomeEvent = { type, data };
    listeners.forEach(listener => listener(event));
  }

  public addEventListener(type: MetronomeEventType, listener: (event: MetronomeEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: MetronomeEventType, listener: (event: MetronomeEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudioContext();
    }

    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying = true;
    this.settings.isPlaying = true;
    this.nextBeatTime = this.audioContext.currentTime;
    this.currentBeat = 0;
    this.currentMeasure = 1;

    this.scheduleBeats();
    this.emitEvent('start', this.settings);
  }

  public stop(): void {
    this.isPlaying = false;
    this.settings.isPlaying = false;
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.emitEvent('stop', this.settings);
  }

  public setBpm(bpm: number): void {
    if (bpm < 30 || bpm > 300) {
      throw new Error('BPM must be between 30 and 300');
    }
    
    this.settings.bpm = bpm;
    this.emitEvent('settingsChange', this.settings);
  }

  public setTimeSignature(numerator: number, denominator: number): void {
    if (numerator < 1 || numerator > 12) {
      throw new Error('Time signature numerator must be between 1 and 12');
    }
    
    if (![1, 2, 4, 8, 16].includes(denominator)) {
      throw new Error('Time signature denominator must be 1, 2, 4, 8, or 16');
    }

    this.settings.timeSignatureNumerator = numerator;
    this.settings.timeSignatureDenominator = denominator;
    this.emitEvent('settingsChange', this.settings);
  }

  public setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }
    
    this.settings.volume = volume;
    this.emitEvent('settingsChange', this.settings);
  }

  public getSettings(): MetronomeSettings {
    return { ...this.settings };
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }

  public async ensureAudioContext(): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      await this.initializeAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public destroy(): void {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// Global instance
let metronomeInstance: MetronomeEngine | null = null;

export function getMetronomeInstance(): MetronomeEngine {
  if (!metronomeInstance) {
    metronomeInstance = new MetronomeEngine();
  }
  return metronomeInstance;
}

export function destroyMetronomeInstance(): void {
  if (metronomeInstance) {
    metronomeInstance.destroy();
    metronomeInstance = null;
  }
}