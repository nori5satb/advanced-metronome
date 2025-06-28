import { useState } from 'react';
import { useMetronome } from '../../lib/metronome-context';

interface MetronomeControlsProps {
  className?: string;
}

export default function MetronomeControls({ className = '' }: MetronomeControlsProps) {
  const { 
    settings, 
    isPlaying, 
    start, 
    stop, 
    setBpm, 
    setTimeSignature, 
    setVolume,
    setCountInEnabled,
    setCountInBeats,
    setCountInVolume,
    ensureAudioContext 
  } = useMetronome();

  const [error, setError] = useState<string | null>(null);

  const handlePlayStop = async () => {
    try {
      setError(null);
      if (isPlaying) {
        stop();
      } else {
        await ensureAudioContext();
        await start();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start metronome');
    }
  };

  const handleBpmChange = (delta: number) => {
    const newBpm = Math.max(30, Math.min(300, settings.bpm + delta));
    setBpm(newBpm);
  };

  const handleBpmInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 30 && value <= 300) {
      setBpm(value);
    }
  };

  const handleTimeSignatureChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [numerator, denominator] = event.target.value.split('/').map(Number);
    setTimeSignature(numerator, denominator);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setVolume(value);
  };

  const handleCountInToggle = () => {
    setCountInEnabled(!settings.countInEnabled);
  };

  const handleCountInBeatsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const beats = parseInt(event.target.value);
    setCountInBeats(beats);
  };

  const handleCountInVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setCountInVolume(value);
  };

  const timeSignatures = [
    '2/4', '3/4', '4/4', '5/4', '6/4', '7/4',
    '6/8', '7/8', '9/8', '12/8'
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Play/Stop Button */}
      <div className="text-center mb-6">
        <button
          onClick={handlePlayStop}
          className={`
            w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full text-2xl sm:text-3xl md:text-4xl font-semibold
            transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 touch-manipulation
            min-w-[44px] min-h-[44px]
            ${isPlaying 
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white animate-pulse' 
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white'
            }
          `}
        >
          {isPlaying ? '⏹️' : '▶️'}
        </button>
      </div>

      {/* BPM Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tempo (BPM)
        </label>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleBpmChange(-10)}
            className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded font-semibold text-sm sm:text-base transition-all duration-150 touch-manipulation min-w-[44px] min-h-[44px]"
          >
            -10
          </button>
          <button
            onClick={() => handleBpmChange(-1)}
            className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded font-semibold text-sm sm:text-base transition-all duration-150 touch-manipulation min-w-[44px] min-h-[44px]"
          >
            -1
          </button>
          <input
            type="number"
            min="30"
            max="300"
            value={settings.bpm}
            onChange={handleBpmInput}
            className="flex-1 px-3 py-3 border border-gray-300 rounded text-center font-semibold text-lg sm:text-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px]"
          />
          <button
            onClick={() => handleBpmChange(1)}
            className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded font-semibold text-sm sm:text-base transition-all duration-150 touch-manipulation min-w-[44px] min-h-[44px]"
          >
            +1
          </button>
          <button
            onClick={() => handleBpmChange(10)}
            className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded font-semibold text-sm sm:text-base transition-all duration-150 touch-manipulation min-w-[44px] min-h-[44px]"
          >
            +10
          </button>
        </div>
      </div>

      {/* Time Signature */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Signature
        </label>
        <select
          value={`${settings.timeSignatureNumerator}/${settings.timeSignatureDenominator}`}
          onChange={handleTimeSignatureChange}
          className="w-full px-3 py-3 border border-gray-300 rounded font-semibold text-center text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 min-h-[44px] touch-manipulation"
        >
          {timeSignatures.map(sig => (
            <option key={sig} value={sig}>{sig}</option>
          ))}
        </select>
      </div>

      {/* Volume Control */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volume ({Math.round(settings.volume * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.volume}
          onChange={handleVolumeChange}
          className="w-full h-3 sm:h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation min-h-[44px] slider-thumb"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settings.volume * 100}%, #e5e7eb ${settings.volume * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Count-in Settings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            カウントイン機能
          </label>
          <button
            onClick={handleCountInToggle}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
              ${settings.countInEnabled ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                ${settings.countInEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        
        {settings.countInEnabled && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                カウントイン拍数
              </label>
              <select
                value={settings.countInBeats}
                onChange={handleCountInBeatsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(beats => (
                  <option key={beats} value={beats}>{beats}拍</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                カウントイン音量 ({Math.round(settings.countInVolume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.countInVolume}
                onChange={handleCountInVolumeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settings.countInVolume * 100}%, #e5e7eb ${settings.countInVolume * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick BPM Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[60, 90, 120, 140, 160, 180].map(bpm => (
            <button
              key={bpm}
              onClick={() => setBpm(bpm)}
              className={`
                px-3 py-3 rounded text-sm sm:text-base font-medium transition-all duration-150 touch-manipulation min-h-[44px]
                ${settings.bpm === bpm
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
                }
              `}
            >
              {bpm}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}