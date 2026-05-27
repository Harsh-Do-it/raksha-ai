import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import taTranslation from './locales/ta/translation.json';
import teTranslation from './locales/te/translation.json';
import knTranslation from './locales/kn/translation.json';
import mlTranslation from './locales/ml/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
      ta: { translation: taTranslation },
      te: { translation: teTranslation },
      kn: { translation: knTranslation },
      ml: { translation: mlTranslation },
    },
    interpolation: {
      escapeValue: false, // React is safe from XSS
    },
  });

export default i18n;
