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

  return (
    <div className="p-4 bg-white shadow-md rounded mb-4">
      <h2 className="text-lg font-bold mb-2">📊 Depth Score</h2>
      <div className="space-y-2 text-sm text-gray-700">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-semibold capitalize">
              {key.replace(/([A-Z])/g, ' $1')}:
            </span>
            <strong>{value}/100</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
