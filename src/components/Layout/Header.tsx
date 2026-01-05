import { Languages } from 'lucide-react';
import { useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';

interface HeaderProps {
  title: string;
  onNavigate?: (view: string, projectId?: string) => void;
}

export function Header({ title, onNavigate }: HeaderProps) {
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex justify-between items-center px-8 z-10 shrink-0">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 mr-2">
          <button
            onClick={() => setCurrency('COP')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              currency === 'COP'
                ? 'bg-white shadow-sm text-slate-800 border border-gray-200'
                : 'text-gray-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            COP
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              currency === 'USD'
                ? 'bg-white shadow-sm text-slate-800 border border-gray-200'
                : 'text-gray-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            USD
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title={t('settings.selectLanguage')}
          >
            <Languages size={16} />
            <span className="text-xs font-bold">{language.toUpperCase()}</span>
          </button>
          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setLanguage('es');
                  setShowLanguageMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  language === 'es' ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{t('settings.spanish')}</span>
                {language === 'es' && <span>✓</span>}
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                  setShowLanguageMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  language === 'en' ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{t('settings.english')}</span>
                {language === 'en' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        <NotificationDropdown onNavigate={onNavigate} />
      </div>
    </header>
  );
}
