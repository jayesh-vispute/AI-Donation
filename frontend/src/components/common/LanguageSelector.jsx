import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];
const SUPPORTED_LANGUAGES = new Set(LANGUAGES.map(({ code }) => code));

export default function LanguageSelector({ style, className }) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    if (!SUPPORTED_LANGUAGES.has(lang)) return;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLang = i18n.language?.split('-')[0] || 'en';

  return (
    <select
      id="language-selector"
      name="language-selector"
      value={currentLang}
      onChange={handleLanguageChange}
      aria-label={t('common.selectLanguage', 'Select language')}
      className={className}
      style={{
        background: '#fff',
        border: '1px solid #EAE5DE',
        color: '#2B1D14',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        cursor: 'pointer',
        maxWidth: '90px',
        textOverflow: 'ellipsis',
        ...style,
      }}
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
