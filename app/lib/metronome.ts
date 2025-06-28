export interface MetronomeSettings {
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  volume: number;
  isPlaying: boolean;
  countInEnabled: boolean;
  countInBeats: number;
  countInVolume: number;
  loopEnabled: boolean;
  loopStartMeasure: number;
  loopEndMeasure: number;
  currentLoop: number;
  targetLoops: number;
}

export interface BeatInfo {
  beat: number;
  measure: number;
  isDownbeat: boolean;
  timestamp: number;
  isCountIn?: boolean;
}

export type MetronomeEventType = 'beat' | 'start' | 'stop' | 'settingsChange' | 'countInStart' | 'countInEnd' | 'loopStart' | 'loopEnd' | 'loopComplete';

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
  private isCountingIn = false;
  private countInBeatsRemaining = 0;
  
  private settings: MetronomeSettings = {
    bpm: 120,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    volume: 0.7,
    isPlaying: false,
    countInEnabled: true,
    countInBeats: 4,
    countInVolume: 0.5,
    loopEnabled: false,
    loopStartMeasure: 1,
    loopEndMeasure: 4,
    currentLoop: 0,
    targetLoops: 0
  };

  private eventListeners: Map<MetronomeEventType, ((event: MetronomeEvent) => void)[]> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      // 低遅延設定でAudioContextを初期化
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100, // 標準サンプルレート
      });
      
      // Resume audio context if suspended (required for mobile browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // 遅延測定とログ
      if (this.audioContext.baseLatency !== undefined) {
        console.log(`Audio Context Base Latency: ${(this.audioContext.baseLatency * 1000).toFixed(2)}ms`);
      }
      if (this.audioContext.outputLatency !== undefined) {
        console.log(`Audio Context Output Latency: ${(this.audioContext.outputLatency * 1000).toFixed(2)}ms`);
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Web Audio API is not supported in this browser');
    }
  }

  private createClickSound(isDownbeat: boolean, when: number, isCountIn: boolean = false): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Different frequencies for downbeat, regular beats, and count-in
    let frequency: number;
    if (isCountIn) {
      frequency = isDownbeat ? 660 : 330; // E5 for count-in downbeat, E4 for regular count-in beats
    } else {
      frequency = isDownbeat ? 880 : 440; // A5 for downbeat, A4 for regular beats
    }
    
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.type = 'square'; // より軽量な波形

    // 最適化されたエンベロープ（より短い音で遅延を削減）
    const volume = isCountIn ? this.settings.countInVolume : this.settings.volume;
    gainNode.gain.setValueAtTime(0, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + 0.05); // 50msに短縮

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(when);
    oscillator.stop(when + 0.05);

    // メモリリークを防ぐためのクリーンアップ
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  private scheduleBeats(): void {
    if (!this.audioContext || !this.isPlaying) return;

    const currentTime = this.audioContext.currentTime;
    const lookahead = 0.025; // 25ms lookahead
    
    while (this.nextBeatTime < currentTime + lookahead) {
      const isDownbeat = this.currentBeat % this.settings.timeSignatureNumerator === 0;
      
      // Handle count-in logic
      if (this.isCountingIn) {
        // Schedule count-in audio
        this.createClickSound(isDownbeat, this.nextBeatTime, true);
        
        // Emit count-in beat event
        this.emitEvent('beat', {
          beat: (this.currentBeat % this.settings.timeSignatureNumerator) + 1,
          measure: this.currentMeasure,
          isDownbeat,
          timestamp: this.nextBeatTime,
          isCountIn: true
        });

        this.countInBeatsRemaining--;
        
        // Check if count-in is finished
        if (this.countInBeatsRemaining <= 0) {
          this.isCountingIn = false;
          this.currentBeat = 0;
          this.currentMeasure = 1;
          this.emitEvent('countInEnd');
        }
      } else {
        // Normal metronome beats
        this.createClickSound(isDownbeat, this.nextBeatTime);
        
        // Emit beat event
        this.emitEvent('beat', {
          beat: (this.currentBeat % this.settings.timeSignatureNumerator) + 1,
          measure: this.currentMeasure,
          isDownbeat,
          timestamp: this.nextBeatTime,
          isCountIn: false
        });
      }

      // Calculate next beat time
      const beatInterval = 60.0 / this.settings.bpm;
      this.nextBeatTime += beatInterval;
      
      // Advance beat counter
      this.currentBeat++;
      if (!this.isCountingIn && this.currentBeat % this.settings.timeSignatureNumerator === 0) {
        this.currentMeasure++;
        
        // Check for loop conditions
        if (this.settings.loopEnabled && this.currentMeasure > this.settings.loopEndMeasure) {
          this.settings.currentLoop++;
          this.emitEvent('loopEnd', this.settings);
          
          // Check if we've completed all target loops
          if (this.settings.targetLoops > 0 && this.settings.currentLoop >= this.settings.targetLoops) {
            this.emitEvent('loopComplete', this.settings);
            this.stop();
            return;
          }
          
          // Reset to loop start
          this.currentMeasure = this.settings.loopStartMeasure;
          this.emitEvent('loopStart', this.settings);
        }
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
    
    // Initialize count-in if enabled
    if (this.settings.countInEnabled) {
      this.isCountingIn = true;
      this.countInBeatsRemaining = this.settings.countInBeats;
      this.currentBeat = 0;
      this.currentMeasure = 1;
      this.emitEvent('countInStart', this.settings);
    } else {
      this.isCountingIn = false;
      this.currentBeat = 0;
      this.currentMeasure = this.settings.loopEnabled ? this.settings.loopStartMeasure : 1;
    }
    
    // Reset loop counter
    this.settings.currentLoop = 0;

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

  public setCountInEnabled(enabled: boolean): void {
    this.settings.countInEnabled = enabled;
    this.emitEvent('settingsChange', this.settings);
  }

  public setCountInBeats(beats: number): void {
    if (beats < 1 || beats > 8) {
      throw new Error('Count-in beats must be between 1 and 8');
    }
    
    this.settings.countInBeats = beats;
    this.emitEvent('settingsChange', this.settings);
  }

  public setCountInVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new Error('Count-in volume must be between 0 and 1');
    }
    
    this.settings.countInVolume = volume;
    this.emitEvent('settingsChange', this.settings);
  }

  public setLoopEnabled(enabled: boolean): void {
    this.settings.loopEnabled = enabled;
    this.emitEvent('settingsChange', this.settings);
  }

  public setLoopRange(startMeasure: number, endMeasure: number): void {
    if (startMeasure < 1) {
      throw new Error('Loop start measure must be at least 1');
    }
    if (endMeasure <= startMeasure) {
      throw new Error('Loop end measure must be greater than start measure');
    }
    
    this.settings.loopStartMeasure = startMeasure;
    this.settings.loopEndMeasure = endMeasure;
    this.emitEvent('settingsChange', this.settings);
  }

  public setTargetLoops(loops: number): void {
    if (loops < 0) {
      throw new Error('Target loops must be 0 or greater');
    }
    
    this.settings.targetLoops = loops;
    this.emitEvent('settingsChange', this.settings);
  }

  public getCurrentMeasure(): number {
    return this.currentMeasure;
  }

  public jumpToMeasure(measure: number): void {
    if (measure < 1) {
      throw new Error('Measure must be at least 1');
    }
    
    this.currentMeasure = measure;
    // Adjust beat counter to match
    this.currentBeat = (measure - 1) * this.settings.timeSignatureNumerator;
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