import { useState } from 'react';

export default function AutoSuggestOptions({ onOptionsChange }) {
  // 🔹 Local state for enhancement options
  const [options, setOptions] = useState({
    sensoryDetails: false,
    emotionalResonance: false,
    deepPOV: false,
    conflict: false,
  });

  // 🔹 Handle checkbox change
  const handleChange = (option) => {
    setOptions((prev) => {
      const updatedOptions = { ...prev, [option]: !prev[option] };
      onOptionsChange(updatedOptions); // 🔹 Pass selected options up
      return updatedOptions;
    });
  };

  return (
    <div className="flex space-x-4 items-center bg-gray-700 text-gray-200 px-4 py-2 rounded-md">
      <span className="text-sm">✨ Enhance With:</span>

      <label className="flex items-center text-sm space-x-1">
        <input
          type="checkbox"
          checked={options.sensoryDetails}
          onChange={() => handleChange('sensoryDetails')}
        />
        <span>Sensory Details</span>
      </label>

      <label className="flex items-center text-sm space-x-1">
        <input
          type="checkbox"
          checked={options.emotionalResonance}
          onChange={() => handleChange('emotionalResonance')}
        />
        <span>Emotional Resonance</span>
      </label>

      <label className="flex items-center text-sm space-x-1">
        <input
          type="checkbox"
          checked={options.deepPOV}
          onChange={() => handleChange('deepPOV')}
        />
        <span>Deep POV</span>
      </label>

      <label className="flex items-center text-sm space-x-1">
        <input
          type="checkbox"
          checked={options.conflict}
          onChange={() => handleChange('conflict')}
        />
        <span>Conflict</span>
      </label>
    </div>
  );
}
