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

        const text = getLastFewSentences(editor.getText(), 3); // Get last 3 sentences
        if (!text) return;

        const response = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ AI Suggestions:', data.suggestions);

          // ✅ Ensure we take only distinct, properly split suggestions
          const cleanedSuggestions = data.suggestions.flatMap((s) =>
            s
              .split('###')
              .map((item) => item.trim())
              .filter(Boolean)
          );

          setSuggestions(cleanedSuggestions.slice(0, 3)); // Limit to 3
          setShowSuggestions(true);
          setSelectedSuggestion(0);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // ✅ Handle Suggestion Selection (Arrow Keys & Enter)
  // ✅ Handle Suggestion Selection (Arrow Keys, Enter, and Escape)
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
        setShowSuggestions(false); // 🔥 Closes dropdown
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedSuggestion]);

  // ✅ Insert AI-generated text at cursor position
  const insertSuggestion = (suggestion) => {
    if (!editor || !suggestion) return;
    editor.commands.insertContent(suggestion);
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
          <div className="bg-gray-50 border border-gray-300 rounded-md shadow-md p-1 w-72 text-sm">
            {suggestions.map((s, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer ${
                  index === selectedSuggestion
                    ? 'bg-blue-100 text-gray-900 font-medium' // Softer highlight
                    : 'hover:bg-gray-100 transition duration-150 ease-in-out'
                }`}
                onClick={() => insertSuggestion(s)}
              >
                {s}
              </div>
            ))}
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
