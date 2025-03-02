import { useEffect } from 'react';

export default function EditorStatusBox({ wordCount, lastSaved }) {
  const optionsList = ['Sensory Details', 'Emotional Resonance'];

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark p-3 shadow-md rounded-md w-full mt-auto">
      <div className="text-sm font-bold mb-2">Status Box</div>

      {/* 📝 Word Count */}
      <div className="text-sm mb-2">
        📝 <strong>Word Count:</strong> {wordCount}
      </div>

      <div className="text-sm">
        💾 Last Saved:{' '}
        {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Not Saved'}
      </div>
    </div>
  );
}
