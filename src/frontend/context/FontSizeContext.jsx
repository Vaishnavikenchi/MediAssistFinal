import React, { createContext, useContext, useState, useEffect } from 'react';

const FontSizeContext = createContext();

export function useFontSize() {
  return useContext(FontSizeContext);
}

export function FontSizeProvider({ children }) {
  // Default font size scale
  const [fontSizeRatio, setFontSizeRatio] = useState(() => {
    const saved = localStorage.getItem('fontSizeRatio');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('fontSizeRatio', fontSizeRatio.toString());
    // Apply the scale to the html element
    document.documentElement.style.fontSize = `${16 * fontSizeRatio}px`;
  }, [fontSizeRatio]);

  const incrementFontSize = () => {
    setFontSizeRatio(prev => Math.min(prev + 0.1, 1.5)); // Max 1.5x
  };

  const decrementFontSize = () => {
    setFontSizeRatio(prev => Math.max(prev - 0.1, 0.8)); // Min 0.8x
  };

  const resetFontSize = () => {
    setFontSizeRatio(1);
  };

  return (
    <FontSizeContext.Provider value={{ fontSizeRatio, incrementFontSize, decrementFontSize, resetFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}
