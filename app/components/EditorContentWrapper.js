import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor as useEditorContext } from '../context/EditorContext';
import { useDocument } from '../context/DocumentContext';
import RealTimeAnalysisPanel from './RealTimeAnalysisPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faTimes } from '@fortawesome/free-solid-svg-icons';
import ContinueModal from './ContinueModal';

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
  const [isContinueModalOpen, setIsContinueModalOpen] = useState(false);
  const [continueText, setContinueText] = useState('');

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && (event.key === ' ' || event.key === 'Space')) {
        event.preventDefault();

        const selectedText = editor.view.state.doc
          .textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            ' '
          )
          .trim();

        if (selectedText) {
          handleEnhanceMode(selectedText);
        } else {
          setIsContinueModalOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleEnhanceMode = async (selectedText) => {
    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          mode: 'enhance',
          projectId: selectedDoc._id,
        }),
      });

      const result = await response.json();

      editor.commands.insertContentAt(
        { from: editor.state.selection.from, to: editor.state.selection.to },
        result.suggestion
      );
    } catch (error) {
      console.error('Enhance Mode Error:', error);
    }
  };

  const handleContinueMode = async (nextStep = '') => {
    const editorText = editor.getText();

    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editorText,
          mode: 'continue',
          nextStep,
          projectId: selectedDoc._id,
        }),
      });

      const result = await response.json();
      editor.commands.insertContent(result.suggestion);
    } catch (error) {
      console.error('Continue Mode Error:', error);
    }
  };

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

    // Check if the content is actually different
    const currentContent = editor.getHTML();
    const newContent = selectedDoc.content || '';

    if (currentContent !== newContent) {
      // Store the current absolute position of the cursor
      const currentPosition = editor.state.selection.anchor;

      editor.commands.setContent(newContent, true);

      // Restore the cursor position if still within bounds
      const maxPosition = editor.state.doc.content.size;
      const safePosition = Math.min(currentPosition, maxPosition - 1);

      editor.view.dispatch(
        editor.state.tr.setSelection(
          editor.state.selection.constructor.create(
            editor.state.doc,
            safePosition
          )
        )
      );

      editor.commands.focus();
    }

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
      await updateDocument(selectedDoc._id, { content: editor.getHTML() });
      lastSavedContentRef.current = selectedDoc.content;
      setLastSaved(new Date());

      // Set the editor cursor back to the last known position
      if (positionRef.current) {
        editor.view.dispatch(editor.state.tr.setSelection(positionRef.current));
      }
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
        await updateDocument(selectedDoc._id, { content: editor.getHTML() });
        lastSavedContentRef.current = selectedDoc.content;
        setLastSaved(new Date());

        // Set the editor cursor back to the last known position
        if (positionRef.current) {
          editor.view.dispatch(
            editor.state.tr.setSelection(positionRef.current)
          );
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDoc]);

  return (
    <div className="relative flex flex-col h-full scrollbar-hide">
      <div className="flex-1 overflow-y-auto overflow-hidden editor-container pb-8 scrollbar-hide">
        <EditorContent editor={editor} />
      </div>

      <ContinueModal
        isOpen={isContinueModalOpen}
        onClose={() => setIsContinueModalOpen(false)}
        onContinue={(text) => {
          setContinueText(text);
          handleContinueMode(text);
        }}
      />
    </div>
  );
}

const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
