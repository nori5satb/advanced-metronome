import { useMetronome } from '../../lib/metronome-context';

interface MetronomeDisplayProps {
  className?: string;
}

export default function MetronomeDisplay({ className = '' }: MetronomeDisplayProps) {
  const { currentBeat, settings, isPlaying, isCountingIn } = useMetronome();

  const getBeatIndicators = () => {
    const indicators = [];
    for (let i = 1; i <= settings.timeSignatureNumerator; i++) {
      const isActive = currentBeat && currentBeat.beat === i;
      const isDownbeat = i === 1;
      const isCountInBeat = currentBeat?.isCountIn;
      
      indicators.push(
        <div
          key={i}
          className={`
            w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 flex items-center justify-center font-semibold text-sm sm:text-base md:text-lg
            transition-all duration-200 ease-in-out touch-manipulation min-w-[44px] min-h-[44px]
            ${isActive 
              ? isCountInBeat
                ? isDownbeat 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-125 animate-pulse ring-4 ring-orange-200' 
                  : 'bg-yellow-500 border-yellow-500 text-white shadow-lg scale-125 ring-4 ring-yellow-200'
                : isDownbeat 
                  ? 'bg-red-500 border-red-500 text-white shadow-lg scale-125 animate-pulse ring-4 ring-red-200' 
                  : 'bg-blue-500 border-blue-500 text-white shadow-lg scale-125 ring-4 ring-blue-200'
              : isDownbeat
                ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100'
            }
          `}
        >
          {i}
        </div>
      );
    }
    return indicators;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* BPM Display */}
      <div className="text-center mb-6">
        <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-800 mb-2 transition-all duration-300">
          {settings.bpm}
        </div>
        <div className="text-lg sm:text-xl text-gray-600">BPM</div>
      </div>

      {/* Time Signature */}
      <div className="text-center mb-6">
        <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-700 transition-all duration-300">
          {settings.timeSignatureNumerator}/{settings.timeSignatureDenominator}
        </div>
        <div className="text-sm sm:text-base text-gray-500">Time Signature</div>
      </div>

      {/* Beat Indicators */}
      <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-6 flex-wrap">
        {getBeatIndicators()}
      </div>

      {/* Current Beat Info */}
      {isPlaying && currentBeat && (
        <div className="text-center">
          {currentBeat.isCountIn ? (
            <div className="text-lg font-medium text-orange-600">
              カウントイン - 拍 {currentBeat.beat}
            </div>
          ) : (
            <div className="text-lg font-medium text-gray-700">
              小節 {currentBeat.measure}, 拍 {currentBeat.beat}
            </div>
          )}
          {currentBeat.isDownbeat && (
            <div className="text-sm text-red-600 font-semibold">
              {currentBeat.isCountIn ? 'カウントイン開始' : 'ダウンビート'}
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div className="text-center mt-4">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
          isPlaying 
            ? isCountingIn
              ? 'bg-orange-100 text-orange-800 animate-pulse' 
              : 'bg-green-100 text-green-800 animate-pulse'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isPlaying 
            ? isCountingIn 
              ? '🕐 カウントイン中' 
              : '▶️ 再生中'
            : '⏸️ 停止中'
          }
        </span>
      </div>
    </div>
  );
}