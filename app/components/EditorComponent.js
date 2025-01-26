'use client';
import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function EditorComponent({ selectedDoc, onSave, setProject }) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const [docContent, setDocContent] = useState(selectedDoc?.content || '');

  // Initialize the editor with content and settings
  const editor = useEditor({
    extensions: [StarterKit],
    content: docContent,
    editable: true,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setDocContent(content);

      // Update the project state with new content
      setProject((prevProject) => {
        const updatedDocs = prevProject.documents.map((doc) =>
          doc.id === selectedDoc.id ? { ...doc, content } : doc
        );
        return { ...prevProject, documents: updatedDocs };
      });

      // Track typing activity
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);

      console.log('Editor updated content:', content);
    },
  });

  // Sync the editor content when selectedDoc changes
  useEffect(() => {
    if (editor && selectedDoc) {
      editor.commands.setContent(selectedDoc.content || '');
      setDocContent(selectedDoc.content || '');
      console.log('Document switched. Loaded content:', selectedDoc.content);
    }
  }, [selectedDoc, editor]);

  // Autosave every 10 seconds if no typing and changes exist
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (!isTyping && docContent !== lastSavedContentRef.current) {
        console.log('Autosaving content:', docContent);
        onSave({ ...selectedDoc, content: docContent });
        lastSavedContentRef.current = docContent;
      }
    }, 10000);

    return () => clearInterval(autosaveInterval);
  }, [isTyping, docContent, selectedDoc, onSave]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">
        {selectedDoc?.title || 'Untitled Document'}
      </h2>
      <EditorContent
        editor={editor}
        className="border border-gray-300 p-5 min-h-[500px] w-full"
      />
    </div>
  );
}
