import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor as useEditorContext } from '../context/EditorContext';
import { useDocument } from '../context/DocumentContext';
import RealTimeAnalysisPanel from './RealTimeAnalysisPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function EditorContentWrapper({ selectedDoc, setWordCount }) {
  const { setEditor } = useEditorContext();
  const { updateDocument } = useDocument();

  const lastSavedContentRef = useRef(selectedDoc?.content || '');
  const positionRef = useRef(null);
  const autosaveIntervalRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);

  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState('');
  const [analysisData, setAnalysisData] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

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
    editorProps: { attributes: { class: 'editor-content' } },
    onUpdate: ({ editor }) => {
      if (!selectedDoc) return;

      const content = editor.getHTML();
      const plainText = editor.getText();
      setWordCount(getWordCount(plainText));

      if (content !== lastSavedContentRef.current) {
        selectedDoc.content = content;
        positionRef.current = editor.state.selection;
      }

      if (analysisEnabled) {
        const paragraph =
          editor.state.selection.$anchor.nodeBefore?.textContent || '';

        if (typingTimeout) clearTimeout(typingTimeout);

        setTypingTimeout(
          setTimeout(() => {
            setActiveParagraph(paragraph);
            triggerRealTimeAnalysis(paragraph);
          }, 1000)
        );
      }
    },
  });

  const triggerRealTimeAnalysis = async (text) => {
    if (!text.trim()) return;

    setAnalysisData('Analyzing...');

    try {
      const response = await fetch('/api/analyze-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      setAnalysisData(result.analysisHtml || 'No suggestions available.');
    } catch (error) {
      console.error('Failed to fetch paragraph analysis', error);
      setAnalysisData('Error fetching analysis.');
    }
  };

  useEffect(() => {
    if (analysisEnabled && editor) {
      // Get the current selection position
      const selection = editor.state.selection;
      const resolvedPos = selection.$anchor;

      // Traverse up to find the closest parent paragraph node
      const paragraphNode = resolvedPos.node(resolvedPos.depth);

      // Ensure the node is a paragraph and extract its text content
      if (paragraphNode?.type?.name === 'paragraph') {
        const paragraphText = paragraphNode.textContent.trim();
        console.log('PARAGRAPH FOR ANALYSIS: ', paragraphText);
        triggerRealTimeAnalysis(paragraphText);
      }
    }
  }, [analysisEnabled]);

  useEffect(() => {
    if (!editor || !selectedDoc) return;

    editor.commands.setContent(selectedDoc.content || '', true);
    setWordCount(getWordCount(editor.getText() || ''));
    lastSavedContentRef.current = selectedDoc.content || '';
    setLastSaved(new Date());
  }, [selectedDoc, editor]);

  useEffect(() => {
    if (editor && positionRef.current) {
      setTimeout(() => {
        editor.commands.setTextSelection(positionRef.current);
        editor.commands.focus();
      }, 20);
    }
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;

    autosaveIntervalRef.current = setInterval(async () => {
      if (selectedDoc.content === lastSavedContentRef.current) return;

      console.log('💾 Autosaving document (30s interval)...');
      await updateDocument(selectedDoc._id, { content: selectedDoc.content });
      lastSavedContentRef.current = selectedDoc.content;
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(autosaveIntervalRef.current);
  }, [selectedDoc]);

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

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();

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

  return (
    <div className="relative flex flex-col h-full scrollbar-hide">
      <div className="flex-1 overflow-y-auto overflow-hidden editor-container pb-8 scrollbar-hide">
        <EditorContent editor={editor} />
        <FontAwesomeIcon
          icon={analysisEnabled ? faTimes : faLightbulb}
          onClick={() => setAnalysisEnabled(!analysisEnabled)}
          className="fixed top-40 right-8 z-50 text-2xl cursor-pointer text-text-light hover:text-text-accentlight dark:text-text-dark dark:hover:text-text-accentdark"
          title={
            analysisEnabled
              ? 'Disable Real-Time Analysis'
              : 'Enable Real-Time Analysis'
          }
        />
      </div>

      {analysisEnabled && <RealTimeAnalysisPanel analysisHtml={analysisData} />}
    </div>
  );
}

const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
