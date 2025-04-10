import { useState } from 'react';
import EditorContentWrapper from './EditorContentWrapper';
import EditorStatusBar from './EditorStatusBar';

export default function EditorComponent({ selectedDoc }) {
  const [wordCount, setWordCount] = useState(0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative scrollbar-hide min-w-80">
      <EditorContentWrapper
        selectedDoc={selectedDoc}
        setWordCount={setWordCount}
      />
    </div>
  );
}
