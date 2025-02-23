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
  const [autoSuggest, setAutoSuggest] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

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
    editorProps: {
      attributes: {
        class: 'editor-content',
        style: 'padding-bottom: 50px;',
      },
    },
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
    setAutoSuggest('');
    setLastSaved(new Date()); // ✅ Reset timestamp on document switch
  }, [selectedDoc, editor]);

  // ✅ Restore Cursor Position After Document Switch
  useEffect(() => {
    if (editor && positionRef.current) {
      setTimeout(() => {
        editor.commands.setTextSelection(positionRef.current);
        editor.commands.focus();
      }, 20);
    }
  }, [lastSavedContentRef.current]);

  // ✅ Autosave Every 30 Seconds (Only if Changes Were Made)
  useEffect(() => {
    if (!selectedDoc) return;

    autosaveIntervalRef.current = setInterval(async () => {
      if (selectedDoc.content === lastSavedContentRef.current) return;

      console.log('💾 Autosaving document (30s interval)...');
      await updateDocument(selectedDoc._id, { content: selectedDoc.content });
      lastSavedContentRef.current = selectedDoc.content;
      setLastSaved(new Date());
    }, 30000); // ⏳ Autosave every 30 seconds

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
        event.preventDefault(); // 🚫 Prevent browser save dialog

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

  // ✅ AutoSuggest Trigger - Only Fetch When Typing Stops
  useEffect(() => {
    if (!editor) return;

    const handleTyping = () => {
      setTimeout(() => {
        triggerAutoSuggest();
      }, 2000);
    };

    editor.on('update', handleTyping);
    return () => editor.off('update', handleTyping);
  }, [editor]);

  const triggerAutoSuggest = async () => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const fullText = editor.getText();
    const textBeforeCursor = fullText.slice(0, from);
    const lastFewWords = getLastFewWords(textBeforeCursor, 50);

    if (!lastFewWords) return;

    console.log('🚀 Sending AutoSuggest request for:', lastFewWords);

    try {
      const response = await fetch('/api/autosuggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lastFewWords,
          projectId: selectedDoc?._id,
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      const cleanedSuggestion = data.suggestion.replace(/^"|"$/g, '').trim();

      console.log('🎁 Received AutoSuggest:', cleanedSuggestion);
      setAutoSuggest(cleanedSuggestion || '');
    } catch (error) {
      console.error('❌ AutoSuggest Fetch Error:', error);
    }
  };

  // ✅ Accept Suggestion with Tab, Dismiss with Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!autoSuggest) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        acceptSuggestion();
      } else if (event.key === 'Escape') {
        dismissSuggestion();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [autoSuggest]);

  const acceptSuggestion = () => {
    if (!autoSuggest || !editor) return;

    const { from } = editor.state.selection;
    editor.commands.insertContentAt(from, autoSuggest);
    setAutoSuggest('');
  };

  const dismissSuggestion = () => setAutoSuggest('');

  return (
    <div className="relative flex flex-col h-full">
      {/* ✅ Editor Content with Bottom Padding */}
      <div className="flex-1 overflow-y-auto editor-container">
        <EditorContent editor={editor} />
      </div>

      {/* ✅ Fixed Status Bar at the Bottom */}
      <EditorStatusBar
        wordCount={getWordCount(editor?.getText() || '')}
        suggestion={autoSuggest}
        acceptSuggestion={acceptSuggestion}
        dismissSuggestion={dismissSuggestion}
        lastSaved={lastSaved}
      />
    </div>
  );
}

// ✅ Utility Functions
const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const getLastFewWords = (text, count) => {
  const words = text.trim().split(/\s+/);
  return words.slice(-count).join(' ') || '';
};
