import React, { useEffect, useState } from 'react';

export default function RealTimeAnalysisPanel({ analysisHtml }) {
  const [panelHeight, setPanelHeight] = useState('auto');

  useEffect(() => {
    const updatePanelHeight = () => {
      const maxHeight = window.innerHeight - 200; // Ensure it doesn't exceed the viewport height
      setPanelHeight(maxHeight + 'px');
    };

    updatePanelHeight();
    window.addEventListener('resize', updatePanelHeight);
    return () => window.removeEventListener('resize', updatePanelHeight);
  }, []);

  if (!analysisHtml) return null;

  return (
    <div
      className="fixed top-60 right-8 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-lg z-50 w-60"
      style={{ maxHeight: panelHeight, overflow: 'visible' }}
    >
      <div
        className="space-y-2 text-sm"
        dangerouslySetInnerHTML={{ __html: analysisHtml }}
      />
    </div>
  );
}
