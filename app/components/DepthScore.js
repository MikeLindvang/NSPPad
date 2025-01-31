'use client';

import { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

export default function DepthScore() {
  const { selectedDoc } = useContext(ProjectContext);

  const scores = selectedDoc?.analysisScore?.depthScores || {
    sensory: 0,
    pov: 0,
    emotional: 0,
    conflict: 0,
  };

  const feedbackMessages = {
    sensory: 'Improve sensory details for better immersion.',
    pov: 'Avoid overusing filtering words for deeper POV.',
    emotional: 'Increase emotional depth in character interactions.',
    conflict: 'Raise the stakes to enhance tension.',
  };

  return (
    <div className="mt-5 p-4 border-t border-gray-300 bg-white shadow-md rounded">
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
                  key === 'sensory'
                    ? 'bg-green-500'
                    : key === 'pov'
                    ? 'bg-blue-500'
                    : key === 'emotional'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition bg-black/80 rounded">
                {feedbackMessages[key]}
              </div>
            </div>
            <span>{value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
