// EditorContext.js - Manages Tiptap editor instance
'use client';
import { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [editorInstance, setEditorInstance] = useState(null);

  const setEditor = (editor) => {
    console.log('📌 Setting editor instance:', editor);
    setEditorInstance(editor);
  };

  const selectTextInEditor = (text) => {
    if (!editorInstance || !text) {
      console.warn('⚠️ Editor instance or text is missing.');
      return;
    }

    const { state, view } = editorInstance;
    console.log(
      '📝 Full ProseMirror Document:',
      JSON.stringify(state.doc.toJSON(), null, 2)
    );

    const docContent = editorInstance.getText();
    const startIndex = docContent.indexOf(text);
    if (startIndex === -1) {
      console.warn(`⚠️ Text not found in document: "${text}"`);
      return;
    }

    const endIndex = startIndex + text.length;
    console.log(
      `🔍 Searching for: "${text}" (Start: ${startIndex}, End: ${endIndex})`
    );

    let fromPos = null;
    let toPos = null;

    try {
      state.doc.descendants((node, pos) => {
        console.log(`🔍 Node at ${pos}:`, node.toJSON());

        if (node.isText && node.text.includes(text)) {
          const relativeStart = node.text.indexOf(text);
          fromPos = pos + relativeStart; // Ensure correct offset
          toPos = fromPos + text.length;
          return false; // Stop iteration once found
        }
      });

      if (fromPos !== null && toPos !== null) {
        console.log(`✅ Applying selection from ${fromPos} to ${toPos}`);

        // 🔹 Apply selection
        editorInstance.commands.setTextSelection({ from: fromPos, to: toPos });

        // 🔹 Ensure editor updates correctly
        editorInstance.view.dispatch(editorInstance.state.tr.scrollIntoView());

        // 🔹 Ensure editor is focused
        editorInstance.commands.focus();

        console.log(
          `✅ Successfully selected text: "${text}" from ${fromPos} to ${toPos}`
        );
      } else {
        console.warn(`⚠️ Could not resolve selection for text: "${text}"`);
      }
    } catch (error) {
      console.error('❌ Error selecting text in editor:', error);
    }
  };

  return (
    <EditorContext.Provider
      value={{ editorInstance, setEditor, selectTextInEditor }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
