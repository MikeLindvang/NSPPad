import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAlt } from '@fortawesome/free-solid-svg-icons';

export default function EditorStatusBox({
  wordCount,
  lastSaved,
  enhancementOptions = {},
  setEnhancementOptions,
}) {
  const optionsList = [
    'Sensory Details',
    'Emotional Resonance',
    'Deep POV',
    'Conflict',
  ];

  // Set default state with 'Sensory Details' selected
  useEffect(() => {
    if (setEnhancementOptions && !enhancementOptions['Sensory Details']) {
      setEnhancementOptions((prevOptions) => ({
        ...prevOptions,
        'Sensory Details': true,
      }));
    }
  }, [setEnhancementOptions, enhancementOptions]);

  const handleCheckboxChange = (option) => {
    if (!setEnhancementOptions) return;
    setEnhancementOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
  };

  // 🆕 Dragging & Position State
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const boxRef = useRef(null);

  // 🆕 Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('statusBoxPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  // 🆕 Handle Dragging
  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const { offsetLeft, offsetTop } = boxRef.current;

    const handleMouseMove = (e) => {
      const newX = offsetLeft + e.clientX - startX;
      const newY = offsetTop + e.clientY - startY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      localStorage.setItem('statusBoxPosition', JSON.stringify(position));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={boxRef}
      className="fixed bg-gray-800 text-gray-200 p-2 shadow-md rounded-md z-50 cursor-move w-48"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold">Status Box</span>
        <FontAwesomeIcon
          icon={faArrowsAlt}
          className="text-white cursor-pointer"
          title="Drag to Move"
        />
      </div>

      {/* 📝 Word Count */}
      <div className="text-xs mb-1">
        📝 <strong>Word Count:</strong> {wordCount}
      </div>

      {/* 🛠️ Enhancement Options */}
      <div className="text-xs flex flex-col space-y-1">
        {optionsList.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-1 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={enhancementOptions[option]}
              onChange={() => handleCheckboxChange(option)}
              className="form-checkbox text-blue-500"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {/* 💾 Last Saved Timestamp */}
      <hr />
      <div className="text-xs mt-1">
        💾 Last Saved:{' '}
        {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Not Saved'}
      </div>
    </div>
  );
}
