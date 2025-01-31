'use client';

import { useEffect, useRef, useState, useContext } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { useProject } from '../context/ProjectContext';

export default function EditorComponent() {
  const {
    selectedDoc,
    updateDocument,
    saveDocument,
    setEditor,
    activeHighlight,
    selectTextInEditor,
    setEditorInstance,
  } = useProject();

  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // ✅ Initialize the editor with content and settings
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }), // ✅ Ensures highlight works
    ],
    content: selectedDoc?.content || '',
    editable: true,
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      updateDocument(selectedDoc._id, { content });

      // ✅ Update word count
      setWordCount(getWordCount(editor.getText()));

      // ✅ Start autosave debounce
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    },
  });

  useEffect(() => {
    if (editor) {
      console.log('✅ Passing editor to ProjectContext...');
      setEditorInstance(editor); // ✅ Pass editor to context
    }
  }, [editor]);

  // ✅ Ensure the correct document content loads when switching docs
  useEffect(() => {
    if (editor && selectedDoc) {
      console.log('🔹 Switching to new document:', selectedDoc.title);
      editor.commands.setContent(selectedDoc.content || '');
      setWordCount(getWordCount(selectedDoc.content || ''));
      lastSavedContentRef.current = selectedDoc.content || '';
    }
  }, [selectedDoc, editor]);

  // ✅ Autosave every 5 seconds if typing stops
  useEffect(() => {
    const autosaveInterval = setInterval(async () => {
      if (
        !isTyping &&
        selectedDoc &&
        lastSavedContentRef.current !== selectedDoc.content
      ) {
        console.log('💾 Autosaving document...');
        await saveDocument(selectedDoc._id, { content: editor.getHTML() });
        lastSavedContentRef.current = selectedDoc.content;
      }
    }, 5000);

    return () => clearInterval(autosaveInterval);
  }, [isTyping, selectedDoc, editor, saveDocument]);

  // ✅ Select text in editor when `activeHighlight` changes
  useEffect(() => {
    if (editor && activeHighlight) {
      console.log('🔹 Selecting text in editor:', activeHighlight);
      selectTextInEditor(activeHighlight.text);
    }
  }, [activeHighlight]);

  // ✅ Function to calculate word count
  const getWordCount = (text) =>
    text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Content - Full height between header and DepthScore */}
      <div className="flex-1 overflow-hidden p-10 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* Word Count Display */}
      <div className="py-2 px-4 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm w-fit mx-auto">
        <p>
          <strong>Word Count: {wordCount}</strong>
        </p>
      </div>
    </div>
  );
}
