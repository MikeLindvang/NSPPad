'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor as useEditorContext } from '../context/EditorContext';
import { useFeedback } from '../context/FeedbackContext';
import { useDocument } from '../context/DocumentContext';

export default function EditorComponent({ selectedDoc }) {
  const { setEditor, selectTextInEditor } = useEditorContext();
  const { activeHighlight } = useFeedback();
  const { updateDocument } = useDocument();

  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // 🔹 Stores AI suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0); // 🔹 Tracks highlighted suggestion
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // ✅ Initialize Tiptap Editor (Paragraphs ONLY)
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
      },
    },
    onUpdate: ({ editor }) => {
      if (!selectedDoc) return;

      const content = editor.getHTML();
      const plainText = editor.getText();

      if (content !== lastSavedContentRef.current) {
        selectedDoc.content = content;
        setWordCount(getWordCount(plainText));

        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(async () => {
          setIsTyping(false);
          if (lastSavedContentRef.current !== content) {
            console.log('💾 Autosaving document...');
            await updateDocument(selectedDoc._id, { content });
            lastSavedContentRef.current = content;
          }
        }, 2000);
      }
    },
  });

  // ✅ Load document into editor
  useEffect(() => {
    if (!editor || !selectedDoc) return;
    if (editor.getHTML() !== selectedDoc.content) {
      editor.commands.setContent(selectedDoc.content || '');
      setWordCount(getWordCount(editor.getText() || ''));
      lastSavedContentRef.current = selectedDoc.content || '';
    }
  }, [selectedDoc, editor]);

  useEffect(() => {
    if (editor) {
      setEditor(editor);
    }
  }, [editor]);

  // ✅ Detect `Ctrl + Space` for AI Autocomplete
  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        console.log('🚀 AI Autocomplete Triggered');

        const fullText = editor.getText(); // 🔹 Get entire document text
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

        let requestBody = {};

        if (selectedText.length > 0) {
          console.log('🖊️ Text Selected:', selectedText);

          // 🔹 Provide broader context (150 chars before & after selection)
          const surroundingContext = fullText.slice(
            Math.max(0, from - 150),
            to + 150
          );

          requestBody = {
            text: `Context:\n${surroundingContext}\n\nNow focus on this and make it stronger:\n[FOCUS] ${selectedText}`,
            mode: 'enhance',
          };
        } else {
          const lastFewSentences = getLastFewSentences(fullText, 3);
          if (!lastFewSentences) return;
          console.log('✍️ Generating Next Line');

          requestBody = {
            text: lastFewSentences,
            mode: 'continue', // 🔹 Generate next line
          };
        }

        // ✅ Send request to API
        const response = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ AI Suggestions:', data.suggestions);

          const cleanedSuggestions = data.suggestions.flatMap((s) =>
            s
              .split('###')
              .map((item) => item.trim())
              .filter(Boolean)
          );

          setSuggestions(cleanedSuggestions.slice(0, 3));
          setShowSuggestions(true);
          setSelectedSuggestion(0);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // ✅ Handle Suggestion Selection (Arrow Keys, Enter & Escape)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showSuggestions) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestion((prev) => (prev + 1) % suggestions.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestion(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        insertSuggestion(suggestions[selectedSuggestion]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowSuggestions(false); // 🔹 Close modal on Escape
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedSuggestion]);

  // ✅ Insert AI-generated text at cursor position
  const insertSuggestion = (suggestion) => {
    if (!editor || !suggestion) return;
    if (editor.state.selection.empty) {
      // No selection: insert normally
      editor.commands.insertContent(suggestion);
    } else {
      // Text selected: replace selection with enhanced version
      editor.commands.insertContentAt(
        editor.state.selection.ranges,
        suggestion
      );
    }

    setShowSuggestions(false);
  };

  // ✅ Extracts last `n` sentences from text
  const getLastFewSentences = (text, numSentences) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences.slice(-numSentences).join(' ') : '';
  };

  // ✅ Word Count Helper
  const getWordCount = (text) =>
    text.trim().split(/\s+/).filter(Boolean).length;

  if (!selectedDoc) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No document selected. Please create or select a document.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden p-10 min-h-[500px] relative">
        <EditorContent editor={editor} />

        {/* 🔹 AI Suggestions Popup */}
        {showSuggestions && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 m-40 w-auto h-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                AI Suggestions
              </h2>

              <div className="max-h-60 overflow-y-auto">
                {suggestions.map((s, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md cursor-pointer text-sm ${
                      index === selectedSuggestion
                        ? 'bg-blue-100 text-gray-900 font-medium'
                        : 'hover:bg-gray-100 transition duration-150 ease-in-out'
                    }`}
                    onClick={() => insertSuggestion(s)}
                  >
                    {s}
                  </div>
                ))}
              </div>

              {/* Buttons for Escape & Close */}
              <div className="flex justify-end mt-4 space-x-3">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => setShowSuggestions(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() =>
                    insertSuggestion(suggestions[selectedSuggestion])
                  }
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="py-2 px-4 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm w-fit mx-auto">
        <p>
          <strong>Word Count: {wordCount}</strong>
        </p>
      </div>
    </div>
  );
}
