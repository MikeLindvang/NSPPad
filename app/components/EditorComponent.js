'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor as useEditorContext } from '../context/EditorContext';
import { useFeedback } from '../context/FeedbackContext';
import { useDocument } from '../context/DocumentContext';
import { useProject } from '../context/ProjectContext';

export default function EditorComponent({ selectedDoc }) {
  const { setEditor, selectTextInEditor } = useEditorContext();
  const { activeHighlight } = useFeedback();
  const { updateDocument } = useDocument();
  const { project } = useProject();

  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // 🔹 Stores AI suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0); // 🔹 Tracks highlighted suggestion
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // ✅ New State Variables
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  // ✅ Detect `Ctrl + Space` for AI Autocomplete (with Action & Dialogue support)
  // ✅ Detect AI Autocomplete (with Action & Dialogue support)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        console.log('🚀 AI Autocomplete Triggered');

        setShowModeSelection(true); // 🔹 Show Mode Selection First
        setSelectedMode(0); // Default to Standard Mode
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // ✅ Handle Mode Selection
  const handleModeSelect = async () => {
    setShowModeSelection(false);
    setIsLoading(true);

    if (!selectedDoc || !selectedDoc._id) {
      console.error('❌ No document selected for AI autocomplete.');
      return;
    }

    const fullText = editor.getText();
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();

    let mode = selectedText.length > 0 ? 'enhance' : 'continue';
    let modifier = null;
    if (selectedMode === 1) modifier = 'action';
    if (selectedMode === 2) modifier = 'dialogue';

    let requestBody = {
      mode,
      modifier,
      projectId: project._id || null, // ✅ Include projectId
    };

    if (selectedText.length > 0) {
      const surroundingContext = fullText.slice(
        Math.max(0, from - 150),
        to + 150
      );
      requestBody.text = `Context:\n${surroundingContext}\n\nNow focus on this and make it stronger:\n[FOCUS] ${selectedText}`;
    } else {
      const lastFewSentences = getLastFewSentences(fullText, 3);
      if (!lastFewSentences) return;
      requestBody.text = lastFewSentences;
    }

    console.log('📨 Sending AI Request:', requestBody);

    const response = await fetch('/api/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      setSuggestions(data.suggestions.slice(0, 3));
      setShowSuggestions(true);
      setSelectedSuggestion(0);
    }

    setIsLoading(false);
  };

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

  useEffect(() => {
    if (!showModeSelection) return;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedMode((prev) => (prev + 1) % 3);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedMode((prev) => (prev - 1 + 3) % 3);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleModeSelect();
      } else if (event.key === 'Escape') {
        setShowModeSelection(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModeSelection]);

  // ✅ Render Mode Selection UI
  const renderModeSelection = () => {
    if (!showModeSelection) return null;

    const options = ['Standard', 'Action', 'Dialogue'];

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Choose Writing Mode
          </h2>

          <div className="flex flex-col space-y-2">
            {options.map((option, index) => (
              <button
                key={index}
                className={`p-2 rounded-md cursor-pointer ${
                  index === selectedMode
                    ? 'bg-blue-200 font-bold'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedMode(index)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              onClick={() => setShowModeSelection(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={handleModeSelect}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Show Spinner While Fetching Data
  const renderSpinner = () => {
    if (!isLoading) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="p-4 bg-white rounded-md shadow-lg flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V2a10 10 0 00-10 10h2zm2.93 5.07a8 8 0 0111.14 0l1.42-1.42a10 10 0 00-13.98 0l1.42 1.42z"
            ></path>
          </svg>
          <p className="text-gray-700">Generating text...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden p-10 min-h-[500px] relative">
        <EditorContent editor={editor} />
        {/* 
          🔹 Mode Selection Popup
          🔹 Spinner for Loading State
        */}
        {renderModeSelection()}
        {renderSpinner()}

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
