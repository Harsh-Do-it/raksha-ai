import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'hi', name: '\u0939\u093f\u0902\u0926\u0940', flag: 'HI' },
    { code: 'ta', name: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd', flag: 'TA' },
    { code: 'te', name: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41', flag: 'TE' },
    { code: 'kn', name: '\u0c95\u0ca8\u0ccd\u0ca8\u0ca1', flag: 'KN' },
    { code: 'ml', name: '\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02', flag: 'ML' },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select">
        {/* Show current language emoji */}
        {languages.find(l => l.code === i18n.language)?.flag}
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="language-dropdown"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

