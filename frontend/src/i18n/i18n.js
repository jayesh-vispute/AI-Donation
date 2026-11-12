import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import additions from './localeAdditions.json';
import hiOverlay from './overlays/hi.json';
import teOverlay from './overlays/te.json';
import taOverlay from './overlays/ta.json';
import knOverlay from './overlays/kn.json';

const supportedLanguages = ['en', 'te', 'hi', 'ta', 'kn'];
const storedLanguage = localStorage.getItem('language');
const initialLanguage = supportedLanguages.includes(storedLanguage) ? storedLanguage : 'en';

function mergeTranslations(base, additionsToMerge) {
  if (!additionsToMerge || typeof additionsToMerge !== 'object') return base;

  return Object.entries(additionsToMerge).reduce((result, [key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeTranslations(result[key] || {}, value);
    } else {
      result[key] = value;
    }
    return result;
  }, { ...base });
}

const translations = {
  en: mergeTranslations(en, additions),
  te: mergeTranslations(te, teOverlay),
  hi: mergeTranslations(hi, hiOverlay),
  ta: mergeTranslations(ta, taOverlay),
  kn: mergeTranslations(kn, knOverlay),
};

i18n
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      supportedLanguages.map((language) => [language, { translation: translations[language] }]),
    ),
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    saveMissing: false,
    parseMissingKeyHandler: (key, defaultValue) => {
      console.warn(`[i18n] Missing translation: ${key}`);
      return defaultValue || key.split('.').pop();
    },
    react: {
      useSuspense: false, // Prevents Suspense boundary requirement
    },
  });

export default i18n;
