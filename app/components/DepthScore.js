export default function DepthScore() {
  const scores = {
    sensoryDetails: 75,
    povDepth: 65,
    emotionalResonance: 80,
    conflictTension: 70,
  };

  const dummyFeedback = {
    sensoryDetails: 'Improve sensory details for better immersion.',
    povDepth: 'Avoid overusing filtering words for deeper POV.',
    emotionalResonance: 'Increase emotional depth in character interactions.',
    conflictTension: 'Raise the stakes to enhance tension.',
  };

  return (
    <div className="mt-5 p-4 border-t border-gray-300">
      <h2 className="text-lg font-bold mb-3">Depth Score</h2>
      <div className="grid grid-cols-2 gap-8 text-sm text-gray-700">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="relative group">
            <span className="font-semibold capitalize">
              {key.replace(/([A-Z])/g, ' $1')}:
            </span>
            <div className="w-full bg-gray-200 rounded h-3 relative">
              <div
                style={{ width: `${value}%` }}
                className={`h-3 rounded ${
                  key === 'sensoryDetails'
                    ? 'bg-green-500'
                    : key === 'povDepth'
                    ? 'bg-blue-500'
                    : key === 'emotionalResonance'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition bg-black/80 rounded">
                {dummyFeedback[key]}
              </div>
            </div>
            <span>{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
