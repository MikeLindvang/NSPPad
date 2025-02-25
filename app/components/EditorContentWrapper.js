import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor as useEditorContext } from '../context/EditorContext';
import { useDocument } from '../context/DocumentContext';
import EditorStatusBar from './EditorStatusBar';

export default function EditorContentWrapper({ selectedDoc, setWordCount }) {
  const { setEditor } = useEditorContext();
  const { updateDocument } = useDocument();

  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const positionRef = useRef(null);
  const autosaveIntervalRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [enhancementOptions, setEnhancementOptions] = useState({
    sensoryDetails: false,
    emotionalResonance: false,
    deepPOV: false,
    conflict: false,
  });
  const [enhancementResults, setEnhancementResults] = useState([]);
  const [selectedEnhancementIndex, setSelectedEnhancementIndex] = useState(0);
  const [savedSelection, setSavedSelection] = useState(null); // Store selection

  const suggestionBoxRef = useRef(null); // Focus reference for suggestions

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        blockquote: false,
        code: false,
        bulletList: false,
        orderedList: false,
      }),
    ],
    content: selectedDoc?.content || '',
    editable: true,
    editorProps: { attributes: { class: 'editor-content' } },
    onUpdate: ({ editor }) => {
      if (!selectedDoc) return;

      const content = editor.getHTML();
      const plainText = editor.getText();
      setWordCount(getWordCount(plainText));

      if (content !== lastSavedContentRef.current) {
        selectedDoc.content = content;
        positionRef.current = editor.state.selection;
      }
    },
  });

  useEffect(() => {
    if (!editor || !selectedDoc) return;

    editor.commands.setContent(selectedDoc.content || '', true);
    setWordCount(getWordCount(editor.getText() || ''));
    lastSavedContentRef.current = selectedDoc.content || '';
    setLastSaved(new Date());
  }, [selectedDoc, editor]);

  // ✅ Restore Cursor Position After Enhancements
  useEffect(() => {
    if (editor && positionRef.current) {
      setTimeout(() => {
        editor.commands.setTextSelection(positionRef.current);
        editor.commands.focus();
      }, 20);
    }
  }, [enhancementResults]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!enhancementResults.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedEnhancementIndex((prevIndex) =>
          prevIndex < enhancementResults.length - 1 ? prevIndex + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedEnhancementIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : enhancementResults.length - 1
        );
      } else if (event.key === 'Tab') {
        event.preventDefault();
        applyEnhancement(selectedEnhancementIndex);
      } else if (event.key === 'Escape') {
        setEnhancementResults([]);
        setSavedSelection(null); // Reset selection state when closing
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enhancementResults, selectedEnhancementIndex, savedSelection]);

  // ✅ Autosave Every 30 Seconds
  useEffect(() => {
    if (!selectedDoc) return;

    autosaveIntervalRef.current = setInterval(async () => {
      if (selectedDoc.content === lastSavedContentRef.current) return;

      console.log('💾 Autosaving document (30s interval)...');
      await updateDocument(selectedDoc._id, { content: selectedDoc.content });
      lastSavedContentRef.current = selectedDoc.content;
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(autosaveIntervalRef.current);
  }, [selectedDoc]);

  // ✅ Autosave When Leaving Document
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!selectedDoc || selectedDoc.content === lastSavedContentRef.current)
        return;

      console.log('💾 Autosaving before leaving document...');
      await updateDocument(selectedDoc._id, { content: selectedDoc.content });
      lastSavedContentRef.current = selectedDoc.content;
      setLastSaved(new Date());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedDoc]);

  // ✅ Manual Save with CTRL+S
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();

        if (!selectedDoc || selectedDoc.content === lastSavedContentRef.current)
          return;

        console.log('💾 Manually saving document (CTRL+S)...');
        await updateDocument(selectedDoc._id, { content: selectedDoc.content });
        lastSavedContentRef.current = selectedDoc.content;
        setLastSaved(new Date());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDoc]);

  // ✅ Trigger Enhance Mode (CTRL+Space)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        handleEnhance();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enhancementOptions]);

  // ✅ Enhance Text Based on Selected Options
  const handleEnhance = async () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' '); // ✅ More reliable selection

    if (!selectedText.trim()) return;

    setSavedSelection({ from, to });

    console.log('🚀 Enhancing text with options:', enhancementOptions);

    try {
      const response = await fetch('/api/enhancetext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          projectId: selectedDoc?._id,
          options: enhancementOptions,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch enhancements');

      const data = await response.json();

      // ✅ Remove unwanted quotation marks and trim spaces
      const cleanedSuggestions = data.suggestions.map((s) =>
        s.replace(/^["“”‘’]|["“”‘’]$/g, '').trim()
      );

      console.log('🎁 Enhancement Suggestions:', cleanedSuggestions);
      setEnhancementResults(cleanedSuggestions);
    } catch (error) {
      console.error('❌ Error fetching enhancements:', error);
    }
  };

  const applyEnhancement = (index) => {
    if (!editor || !enhancementResults[index] || !savedSelection) return;

    let enhancement = enhancementResults[index];

    // ✅ Remove any surrounding quotation marks
    enhancement = enhancement.replace(/^["“”‘’]|["“”‘’]$/g, '').trim();

    editor
      .chain()
      .focus()
      .setTextSelection(savedSelection) // ✅ Restore selection correctly
      .deleteRange(savedSelection) // ✅ Ensure full replacement
      .insertContent(enhancement)
      .run();

    // Clear suggestions and reset index
    setEnhancementResults([]);
    setSelectedEnhancementIndex(0);
    setSavedSelection(null);
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* ✅ Editor Content */}
      <div className="flex-1 overflow-y-auto overflow-hidden editor-container pb-8">
        <EditorContent editor={editor} />
      </div>

      {/* ✅ Fixed Status Bar */}
      <EditorStatusBar
        wordCount={getWordCount(editor?.getText() || '')}
        lastSaved={lastSaved}
        enhancementOptions={enhancementOptions}
        setEnhancementOptions={setEnhancementOptions}
      />

      {/* ✅ Enhancement Suggestions (If Available) */}
      {enhancementResults.length > 0 && (
        <div
          ref={suggestionBoxRef}
          className="fixed bottom-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg"
          tabIndex={0} // Allows focus
        >
          <p className="text-sm">✨ Choose an Enhancement:</p>
          {enhancementResults.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => applyEnhancement(index)}
              className={`block w-full text-left px-2 py-1 mt-1 rounded-md text-sm ${
                index === selectedEnhancementIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ Utility Functions
const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
