import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sun, Languages } from 'lucide-react';

export function AuthPage() {
  const { signInWithGoogle } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition backdrop-blur-sm"
            title={t('settings.selectLanguage')}
          >
            <Languages size={18} />
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
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Sun size={64} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">SolarEPC Manager</h1>
          <p className="text-white/90 mt-2">{t('auth.signInDescription')}</p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
              {t('auth.signIn')}
            </h2>
            <p className="text-gray-600 text-center text-sm">
              {t('auth.signInWithGoogle')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? t('common.loading') + '...' : t('auth.signInWithGoogle')}
          </button>

          <p className="text-xs text-gray-500 text-center">
            {language === 'es'
              ? 'Al continuar, aceptas nuestros términos y condiciones'
              : 'By continuing, you accept our terms and conditions'}
          </p>
        </div>
      </div>
    </div>
  );
}
