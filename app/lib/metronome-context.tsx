import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getMetronomeInstance, MetronomeEngine } from './metronome';
import type { MetronomeSettings, BeatInfo, MetronomeEvent } from './metronome';

interface MetronomeContextValue {
  settings: MetronomeSettings;
  currentBeat: BeatInfo | null;
  isPlaying: boolean;
  isCountingIn: boolean;
  start: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (numerator: number, denominator: number) => void;
  setVolume: (volume: number) => void;
  setCountInEnabled: (enabled: boolean) => void;
  setCountInBeats: (beats: number) => void;
  setCountInVolume: (volume: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopRange: (startMeasure: number, endMeasure: number) => void;
  setTargetLoops: (loops: number) => void;
  jumpToMeasure: (measure: number) => void;
  ensureAudioContext: () => Promise<void>;
}

const MetronomeContext = createContext<MetronomeContextValue | null>(null);

interface MetronomeProviderProps {
  children: ReactNode;
}

export function MetronomeProvider({ children }: MetronomeProviderProps) {
  const [metronome] = useState<MetronomeEngine>(() => getMetronomeInstance());
  const [settings, setSettings] = useState<MetronomeSettings>(metronome.getSettings());
  const [currentBeat, setCurrentBeat] = useState<BeatInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);

  useEffect(() => {
    const handleBeat = (event: MetronomeEvent) => {
      if (event.type === 'beat' && event.data) {
        setCurrentBeat(event.data as BeatInfo);
      }
    };

    const handleStart = () => {
      setIsPlaying(true);
    };

    const handleStop = () => {
      setIsPlaying(false);
      setCurrentBeat(null);
    };

    const handleSettingsChange = (event: MetronomeEvent) => {
      if (event.type === 'settingsChange' && event.data) {
        setSettings(event.data as MetronomeSettings);
      }
    };

    const handleCountInStart = () => {
      setIsCountingIn(true);
    };

    const handleCountInEnd = () => {
      setIsCountingIn(false);
    };

    metronome.addEventListener('beat', handleBeat);
    metronome.addEventListener('start', handleStart);
    metronome.addEventListener('stop', handleStop);
    metronome.addEventListener('settingsChange', handleSettingsChange);
    metronome.addEventListener('countInStart', handleCountInStart);
    metronome.addEventListener('countInEnd', handleCountInEnd);

    return () => {
      metronome.removeEventListener('beat', handleBeat);
      metronome.removeEventListener('start', handleStart);
      metronome.removeEventListener('stop', handleStop);
      metronome.removeEventListener('settingsChange', handleSettingsChange);
      metronome.removeEventListener('countInStart', handleCountInStart);
      metronome.removeEventListener('countInEnd', handleCountInEnd);
    };
  }, [metronome]);

  const start = useCallback(async () => {
    try {
      await metronome.start();
    } catch (error) {
      console.error('Failed to start metronome:', error);
      throw error;
    }
  }, [metronome]);

  const stop = useCallback(() => {
    metronome.stop();
  }, [metronome]);

  const setBpm = useCallback((bpm: number) => {
    metronome.setBpm(bpm);
  }, [metronome]);

  const setTimeSignature = useCallback((numerator: number, denominator: number) => {
    metronome.setTimeSignature(numerator, denominator);
  }, [metronome]);

  const setVolume = useCallback((volume: number) => {
    metronome.setVolume(volume);
  }, [metronome]);

  const ensureAudioContext = useCallback(async () => {
    await metronome.ensureAudioContext();
  }, [metronome]);

  const setCountInEnabled = useCallback((enabled: boolean) => {
    metronome.setCountInEnabled(enabled);
  }, [metronome]);

  const setCountInBeats = useCallback((beats: number) => {
    metronome.setCountInBeats(beats);
  }, [metronome]);

  const setCountInVolume = useCallback((volume: number) => {
    metronome.setCountInVolume(volume);
  }, [metronome]);

  const setLoopEnabled = useCallback((enabled: boolean) => {
    metronome.setLoopEnabled(enabled);
  }, [metronome]);

  const setLoopRange = useCallback((startMeasure: number, endMeasure: number) => {
    metronome.setLoopRange(startMeasure, endMeasure);
  }, [metronome]);

  const setTargetLoops = useCallback((loops: number) => {
    metronome.setTargetLoops(loops);
  }, [metronome]);

  const jumpToMeasure = useCallback((measure: number) => {
    metronome.jumpToMeasure(measure);
  }, [metronome]);

  const value: MetronomeContextValue = {
    settings,
    currentBeat,
    isPlaying,
    isCountingIn,
    start,
    stop,
    setBpm,
    setTimeSignature,
    setVolume,
    setCountInEnabled,
    setCountInBeats,
    setCountInVolume,
    setLoopEnabled,
    setLoopRange,
    setTargetLoops,
    jumpToMeasure,
    ensureAudioContext
  };

  return (
    <MetronomeContext.Provider value={value}>
      {children}
    </MetronomeContext.Provider>
  );
}

export function useMetronome(): MetronomeContextValue {
  const context = useContext(MetronomeContext);
  if (!context) {
    throw new Error('useMetronome must be used within a MetronomeProvider');
  }
  return context;
}