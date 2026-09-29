import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Default to Bengali ('bn') if not previously set, or restore user preference
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('prntez_lang');
      return saved === 'en' ? 'en' : 'bn';
    } catch (_) {
      return 'bn';
    }
  });

  const setLang = (newLang) => {
    const validLang = newLang === 'en' ? 'en' : 'bn';
    setLangState(validLang);
    try {
      localStorage.setItem('prntez_lang', validLang);
    } catch (_) {}
  };

  const toggleLang = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  // Helper function to fetch nested translation or fallback
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    
    // Check current language
    let curr = translations[lang];
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        curr = null;
        break;
      }
    }
    if (typeof curr === 'string') return curr;

    // Fallback to English if missing in Bengali
    if (lang !== 'en') {
      let enCurr = translations.en;
      for (const p of parts) {
        if (enCurr && typeof enCurr === 'object' && p in enCurr) {
          enCurr = enCurr[p];
        } else {
          enCurr = null;
          break;
        }
      }
      if (typeof enCurr === 'string') return enCurr;
    }

    return fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, toggleLang, isBn: lang === 'bn', isEn: lang === 'en', t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'bn',
      language: 'bn',
      isBn: true,
      isEn: false,
      setLang: () => {},
      toggleLang: () => {},
      t: (path, fallback = '') => fallback || path,
    };
  }
  return context;
}
