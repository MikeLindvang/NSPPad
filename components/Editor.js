'use client';

import { useState, useEffect, useCallback } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { debounce } from 'lodash';

const Editor = ({ document, onSave }) => {
  const [editor] = useState(() => withReact(createEditor()));
  const [title, setTitle] = useState(document.title || '');
  const [content, setContent] = useState(
    JSON.parse(document.content) || [
      { type: 'paragraph', children: [{ text: '' }] },
    ]
  );

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const saveDocument = useCallback(
    debounce(async () => {
      onSave({ title, content: JSON.stringify(content) });
    }, 5000),
    [title, content, onSave]
  );

  useEffect(() => {
    saveDocument();
    return () => saveDocument.cancel();
  }, [title, content, saveDocument]);

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Title"
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <Slate
        editor={editor}
        value={content}
        initialValue={content || []}
        onChange={(newValue) => setContent(newValue)}
      >
        <Editable placeholder="Write your content here..." />
      </Slate>
    </div>
  );
};

export default Editor;
