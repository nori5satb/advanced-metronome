import { MetronomeProvider } from '../../lib/metronome-context';
import MetronomeDisplay from './MetronomeDisplay';
import MetronomeControls from './MetronomeControls';
import PracticeSessionControls from './PracticeSessionControls';

export default function MetronomePage() {
  return (
    <MetronomeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2 sm:mb-4">
              Advanced Metronome
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Precision timing for your musical practice
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Display Panel */}
            <div className="order-2 xl:order-1">
              <MetronomeDisplay className="h-full" />
            </div>

            {/* Controls Panel */}
            <div className="order-1 xl:order-2">
              <MetronomeControls className="h-full" />
            </div>

            {/* Practice Session Panel */}
            <div className="order-3 xl:order-3">
              <PracticeSessionControls className="h-full" />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 sm:mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800 mb-3">
              How to Use
            </h2>
            <ul className="text-blue-700 space-y-2 text-sm sm:text-base">
              <li>• Adjust the tempo using the BPM controls or input field</li>
              <li>• Select your desired time signature from the dropdown</li>
              <li>• Control volume with the slider</li>
              <li>• Click the play button to start the metronome</li>
              <li>• Watch the beat indicators for visual timing</li>
              <li>• The first beat of each measure is highlighted in red (downbeat)</li>
              <li>• Use loop function to repeat specific measure ranges</li>
              <li>• Set target loops for focused practice sessions</li>
              <li>• Jump to specific measures for quick navigation</li>
            </ul>
          </div>

          {/* Technical Info */}
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
            <p>
              Web Audio API • Low Latency Timing • Mobile Optimized • Practice Mode • Loop Function
            </p>
          </div>
        </div>
      </div>
    </MetronomeProvider>
  );
}