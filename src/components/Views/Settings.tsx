import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

export function Settings() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: t('settings.english'), flag: '🇺🇸' },
    { code: 'es', label: t('settings.spanish'), flag: '🇪🇸' },
  ];

  return (
    <div className="p-8 bg-mac-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-mac-gray-900 mb-1">{t('settings.title')}</h1>
      </div>

      <div className="mac-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-mac-gray-200">
          <div className="w-10 h-10 rounded-xl bg-mac-blue-50 flex items-center justify-center">
            <Globe className="text-mac-blue-500" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-mac-gray-900">{t('settings.language')}</h2>
            <p className="text-sm text-mac-gray-500">{t('settings.selectLanguage')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                i18n.language === lang.code
                  ? 'border-mac-blue-500 bg-mac-blue-50/50'
                  : 'border-mac-gray-200 hover:border-mac-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className={`font-medium ${
                  i18n.language === lang.code ? 'text-mac-blue-900' : 'text-mac-gray-700'
                }`}>
                  {lang.label}
                </span>
              </div>
              {i18n.language === lang.code && (
                <div className="w-6 h-6 rounded-full bg-mac-blue-500 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
