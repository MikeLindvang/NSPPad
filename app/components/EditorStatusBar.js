export default function EditorStatusBar({
  wordCount,
  suggestion,
  acceptSuggestion,
  dismissSuggestion,
  lastSaved,
}) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-gray-200 px-4 py-2 flex justify-between items-center shadow-md">
      {/* 🔹 Word Count */}
      <div className="text-sm">
        📝 <strong>Word Count:</strong> {wordCount}
      </div>

      {/* 🔹 AutoSuggest Section */}
      <div className="text-sm flex items-center space-x-2">
        <span>🔮 {suggestion || 'Waiting for suggestion...'}</span>

        {/* Action Buttons */}
        {suggestion && (
          <>
            <button
              onClick={acceptSuggestion}
              className="text-blue-400 text-xs hover:underline"
            >
              Accept (Tab)
            </button>
            <button
              onClick={dismissSuggestion}
              className="text-red-400 text-xs hover:underline"
            >
              Dismiss (Esc)
            </button>
          </>
        )}
      </div>

      {/* 🔹 Last Saved Timestamp (Fixed Width) */}
      <div className="text-sm min-w-[120px] text-center">
        💾 Last Saved:{' '}
        {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Not Saved'}
      </div>
    </div>
  );
}
