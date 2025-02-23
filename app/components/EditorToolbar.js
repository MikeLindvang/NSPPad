'use client';

import { useState, useEffect } from 'react';

export default function EditorToolbar({ handleModeSelect }) {
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState(0);

  useEffect(() => {
    if (!showModeSelection) return;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedMode((prev) => (prev + 1) % 4);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedMode((prev) => (prev === 0 ? 3 : prev - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleModeSelect(selectedMode);
        setShowModeSelection(false);
      } else if (event.key === 'Escape') {
        setShowModeSelection(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModeSelection, selectedMode]);

  return (
    <div>
      <button
        onClick={() => setShowModeSelection(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Choose Writing Mode
      </button>

      {showModeSelection && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Choose Writing Mode
            </h2>

            <div className="flex flex-col space-y-2">
              {['Standard', 'Action', 'Dialogue', 'Depth Boost'].map(
                (option, index) => (
                  <button
                    key={index}
                    className={`p-2 rounded-md cursor-pointer ${
                      index === selectedMode
                        ? 'bg-blue-200 font-bold'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedMode(index)}
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
