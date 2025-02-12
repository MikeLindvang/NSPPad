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

  // ✅ Initialize Tiptap Editor (Paragraphs ONLY)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // ❌ Disable headings
        bold: false, // ❌ No bold
        italic: false, // ❌ No italics
        strike: false, // ❌ No strikethrough
        blockquote: false, // ❌ No blockquote
        code: false, // ❌ No inline code
        bulletList: false, // ❌ No bullet lists
        orderedList: false, // ❌ No ordered lists
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

      const content = editor.getHTML(); // ✅ Get HTML (supports paragraphs)
      const plainText = editor.getText(); // ✅ Extract plain text for word count

      // ✅ Only update if content changed
      if (content !== lastSavedContentRef.current) {
        selectedDoc.content = content; // Update locally
        setWordCount(getWordCount(plainText));

        // ✅ Start autosave debounce
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(async () => {
          setIsTyping(false);

          // ✅ Save only if content changed
          if (lastSavedContentRef.current !== content) {
            console.log('💾 Autosaving document...');
            await updateDocument(selectedDoc._id, { content }); // ✅ Save HTML
            lastSavedContentRef.current = content;
          }
        }, 2000);
      }
    },
  });

  // ✅ Ensure correct document content loads when switching docs
  useEffect(() => {
    if (!editor || !selectedDoc) return;

    console.log('🔹 Loading document into editor:', selectedDoc.title);

    if (editor.getHTML() !== selectedDoc.content) {
      editor.commands.setContent(selectedDoc.content || '');
      setWordCount(getWordCount(editor.getText() || ''));
      lastSavedContentRef.current = selectedDoc.content || '';
      console.log('🔹 Document loaded into editor:', selectedDoc.title);
    }
  }, [selectedDoc, editor]);

  useEffect(() => {
    if (editor) {
      console.log('✅ Passing editor to EditorContext...');
      setEditor(editor);
    }
  }, [editor]);

  // ✅ Improved text selection logic (Supports paragraphs)
  useEffect(() => {
    if (!editor || !activeHighlight?.text) return;

    console.log('🔍 Searching for highlighted text:', activeHighlight.text);

    let fromPos = null;
    let toPos = null;

    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text.includes(activeHighlight.text)) {
        const startPos = pos + node.text.indexOf(activeHighlight.text);
        const endPos = startPos + activeHighlight.text.length;

        console.log(
          `🎯 Adjusted ProseMirror selection from ${startPos} to ${endPos}`
        );

        fromPos = startPos;
        toPos = endPos;
      }
    });

    if (fromPos !== null && toPos !== null) {
      editor.commands.setTextSelection({ from: fromPos, to: toPos });
      editor.commands.scrollIntoView();
      console.log(`✅ Successfully selected text: "${activeHighlight.text}"`);
    } else {
      console.warn('⚠️ Could not locate exact text in ProseMirror document.');
    }
  }, [activeHighlight, editor]);

  // ✅ Function to calculate word count
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
      {/* Editor Content */}
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
