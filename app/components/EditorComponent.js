'use client';
import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function EditorComponent({ selectedDoc, onSave, setProject }) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const [docContent, setDocContent] = useState(selectedDoc?.content || '');

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

      // Update the project state with the new document content
      setProject((prevProject) => {
        const updatedDocs = prevProject.documents.map((doc) =>
          doc.id === selectedDoc.id ? { ...doc, content } : doc
        );
        return { ...prevProject, documents: updatedDocs };
      });

      // Track typing activity with debounce
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    },
  });

  // Sync the editor content when selectedDoc changes
  useEffect(() => {
    if (editor && selectedDoc) {
      editor.commands.setContent(selectedDoc.content || '');
      setDocContent(selectedDoc.content || '');
      lastSavedContentRef.current = selectedDoc.content || '';
    }
  }, [selectedDoc, editor]);

  // Autosave entire project every 10 seconds if content has changed
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (!isTyping && docContent !== lastSavedContentRef.current) {
        console.log('Autosaving entire project...');
        setProject((prevProject) => {
          const updatedDocs = prevProject.documents.map((doc) =>
            doc.id === selectedDoc.id ? { ...doc, content: docContent } : doc
          );
          onSave({ ...prevProject, documents: updatedDocs });
          return { ...prevProject, documents: updatedDocs };
        });

        lastSavedContentRef.current = docContent;
      }
    }, 10000);

    return () => clearInterval(autosaveInterval);
  }, [isTyping, docContent, selectedDoc, setProject, onSave]);

  return (
    <div>
      <EditorContent
        editor={editor}
        className="border border-gray-300 p-5 min-h-[500px] w-full "
      />
    </div>
  );
}
