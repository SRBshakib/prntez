import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageToggle({ className = '', variant = 'pill' }) {
  const { lang, setLang, toggleLang, isBn } = useLanguage();

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLang}
        className={`px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95 ${className}`}
        title="Switch Language (ভাষা পরিবর্তন)"
      >
        <Languages className="w-3.5 h-3.5 text-blue-600" />
        <span>{isBn ? 'English' : 'বাংলা'}</span>
      </button>
    );
  }

  // Segmented Pill Style (Ultra Clean)
  return (
    <div className={`inline-flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs text-[10px] sm:text-[11px] font-bold ${className}`}>
      <button
        type="button"
        onClick={() => setLang('bn')}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          isBn
            ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>বাংলা</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
          !isBn
            ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>EN</span>
      </button>
    </div>
  );
}
