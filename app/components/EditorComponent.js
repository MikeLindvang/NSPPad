'use client';

import { useEffect, useRef, useState, useContext } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ProjectContext } from '../context/ProjectContext';

export default function EditorComponent() {
  const { selectedDoc, updateDocument, saveDocument } =
    useContext(ProjectContext);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const [docContent, setDocContent] = useState(selectedDoc?.content || '');
  const [wordCount, setWordCount] = useState(0);

  // Initialize the editor with content and settings
  const editor = useEditor({
    extensions: [StarterKit],
    content: docContent,
    editable: true,
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setDocContent(content);
      setWordCount(getWordCount(editor.getText()));

      // Update the document in context
      updateDocument(selectedDoc._id, { content });

      // Track typing activity with debounce
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    },
  });

  // Function to calculate word count
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Sync the editor content when selectedDoc changes
  useEffect(() => {
    if (editor && selectedDoc) {
      editor.commands.setContent(selectedDoc.content || '');
      setDocContent(selectedDoc.content || '');
      lastSavedContentRef.current = selectedDoc.content || '';
      setWordCount(getWordCount(selectedDoc.content || ''));
    }
  }, [selectedDoc, editor]);

  // Autosave document every 5 seconds if content has changed
  useEffect(() => {
    const autosaveInterval = setInterval(async () => {
      if (!isTyping && docContent !== lastSavedContentRef.current) {
        console.log('Autosaving document...');
        await saveDocument(selectedDoc._id, { content: docContent });
        lastSavedContentRef.current = docContent;
        console.log('Document saved successfully');
      }
    }, 5000);

    return () => clearInterval(autosaveInterval);
  }, [isTyping, docContent, selectedDoc, saveDocument]);

  return (
    <div>
      <EditorContent
        editor={editor}
        className="border border-gray-300 p-5 min-h-[500px] w-full"
      />
      <div className="mt-2 text-right text-gray-600">
        <p>Word Count: {wordCount}</p>
      </div>
    </div>
  );
}
