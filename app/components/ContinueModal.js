import { useState, useEffect } from 'react';

export default function ContinueModal({ isOpen, onClose, onContinue }) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    onContinue(inputText);
    setInputText('');
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        handleSubmit();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    // Clean up to avoid multiple event listeners
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Continue Story
        </h2>
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          Enter the desired next step for the story:
        </p>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What happens next? (Optional)"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded"
          >
            Cancel (Esc)
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Continue (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
