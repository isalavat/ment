import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Locale } from '../../i18n/locales';
import './LanguageSwitcher.css';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
  ];

  return (
    <div className="language-switcher">
      <select
        className="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
