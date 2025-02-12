// FeedbackContext.js - Manages inline feedback and highlights
'use client';
import { createContext, useContext, useState } from 'react';

const FeedbackContext = createContext();

export const FeedbackProvider = ({ children }) => {
  const [inlineFeedback, setInlineFeedback] = useState(null);
  const [highlights, setHighlights] = useState({});
  const [activeHighlight, setActiveHighlight] = useState(null);

  const addHighlight = (id, text, suggestions) => {
    setHighlights((prev) => ({ ...prev, [id]: { text, suggestions } }));
  };

  const removeHighlight = (id) => {
    setHighlights((prev) => {
      const newHighlights = { ...prev };
      delete newHighlights[id];
      return newHighlights;
    });
  };

  const handleHighlightClick = (id) => {
    setActiveHighlight(id);
  };

  return (
    <FeedbackContext.Provider
      value={{
        inlineFeedback,
        setInlineFeedback,
        highlights,
        addHighlight,
        removeHighlight,
        handleHighlightClick,
        activeHighlight,
        setActiveHighlight,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
