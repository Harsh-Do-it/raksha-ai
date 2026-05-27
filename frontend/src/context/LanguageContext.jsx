import { createContext, useContext } from 'react';
import { useTranslation } from 'i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n, t } = useTranslation();

  const value = {
    currentLanguage: i18n.language,
    changeLanguage: (lang) => i18n.changeLanguage(lang),
    t: t,
    direction: ['ar', 'he'].includes(i18n.language) ? 'rtl' : 'ltr',
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={value.direction}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
