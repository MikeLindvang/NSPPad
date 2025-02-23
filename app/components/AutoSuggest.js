import { useEffect } from 'react';

export default function AutoSuggest({
  suggestion,
  acceptSuggestion,
  dismissSuggestion,
}) {
  return (
    <div className="fixed bottom-10 left-10 bg-gray-200 text-gray-900 px-3 py-2 rounded-md shadow-md text-sm w-auto max-w-md">
      🔮 {suggestion || 'Waiting for suggestion...'}
      <div className="flex space-x-3 mt-1">
        <button
          onClick={acceptSuggestion}
          className="text-blue-500 text-xs hover:underline"
        >
          Accept (Tab)
        </button>
        <button
          onClick={dismissSuggestion}
          className="text-red-500 text-xs hover:underline"
        >
          Dismiss (Esc)
        </button>
      </div>
    </div>
  );
}
