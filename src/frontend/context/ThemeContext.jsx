import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'md';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.classList.remove('font-sm', 'font-md', 'font-lg');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const changeFontSize = (size) => setFontSize(size);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, fontSize, changeFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}
