import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English', bcp47: 'en-US' },
  { code: 'hi', label: 'हि', full: 'Hindi', bcp47: 'hi-IN' },
  { code: 'mr', label: 'मर', full: 'Marathi', bcp47: 'mr-IN' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLang, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
