'use client';

import { useState } from 'react';

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseOver={() => setVisible(true)}
      onFocus={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          aria-hidden={!visible}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 p-2 text-sm text-white bg-gray-800 rounded shadow-lg z-50"
        >
          {content}
        </div>
      )}
    </div>
  );
}
