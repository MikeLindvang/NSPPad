'use client';

import { useState, useRef, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'; // Import star icons
import { useFeedback } from '../context/FeedbackContext';
import { useDocument } from '../context/DocumentContext';

export default function DepthScore() {
  const { inlineFeedback } = useFeedback();
  const { selectedDoc } = useDocument();

  const [hovered, setHovered] = useState(null);
  const tooltipRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState('top');

  const scores = selectedDoc?.analysisScore?.depthScores || {
    sensory: 0,
    pov: 0,
    emotional: 0,
    conflict: 0,
  };

  const feedback = selectedDoc?.analysisData || {
    sensoryDetails: 'No feedback available.',
    povDepth: 'No feedback available.',
    emotionalResonance: 'No feedback available.',
    conflict: 'No feedback available.',
  };

  useEffect(() => {
    if (hovered && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spaceAbove = tooltipRect.top;
      const spaceBelow = window.innerHeight - tooltipRect.bottom;

      if (spaceAbove < 50 && spaceBelow > spaceAbove) {
        setTooltipPosition('bottom'); // Place below if there's more space
      } else {
        setTooltipPosition('top'); // Default to above
      }
    }
  }, [hovered]);

  // Convert score (0-100) into 5-star rating
  const getStarRating = (score) => {
    const stars = [];
    const rating = (score / 20).toFixed(1); // Convert 100 scale → 5 scale

    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-500" />); // Full Star
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />); // Half Star
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-400" />); // Empty Star
      }
    }
    return stars;
  };

  return (
    <div className="p-4 bg-white shadow-md rounded mb-4 relative">
      <h2 className="text-lg font-bold mb-2">📊 Depth Score</h2>
      <div className="space-y-3 text-sm text-gray-700">
        {Object.entries(scores).map(([key, value]) => {
          const feedbackKey =
            key === 'sensory'
              ? 'sensoryDetails'
              : key === 'pov'
              ? 'povDepth'
              : key === 'emotional'
              ? 'emotionalResonance'
              : key; // Conflict stays the same

          return (
            <div
              key={key}
              className="flex justify-between items-center relative group"
              onMouseEnter={() => setHovered(feedbackKey)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="font-semibold capitalize">
                {key.replace(/([A-Z])/g, ' $1')}:
              </span>
              <div className="flex">{getStarRating(value)}</div>

              {/* Tooltip - Centered above/below */}
              {hovered === feedbackKey && (
                <div
                  ref={tooltipRef}
                  className={`absolute w-64 p-2 bg-black text-white text-xs rounded shadow-lg 
                    ${
                      tooltipPosition === 'top'
                        ? 'bottom-full mb-2'
                        : 'top-full mt-2'
                    }
                    left-1/2 transform -translate-x-1/2`}
                >
                  {feedback[feedbackKey]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
