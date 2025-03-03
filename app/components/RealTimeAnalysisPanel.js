import React from 'react';

export default function RealTimeAnalysisPanel({ analysisHtml }) {
  if (!analysisHtml) return null;

  return (
    <div className="fixed top-60 right-8 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-lg z-50 w-60 h-96 max-h-96 overflow-y-auto overflow-hidden">
      <div
        className="space-y-2 text-sm"
        dangerouslySetInnerHTML={{ __html: analysisHtml }}
      />
    </div>
  );
}
