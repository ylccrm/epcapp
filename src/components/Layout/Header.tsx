import { useCurrency } from '../../contexts/CurrencyContext';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';

interface HeaderProps {
  title: string;
  onNavigate?: (view: string, projectId?: string) => void;
}

export function Header({ title, onNavigate }: HeaderProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-mac-gray-200 flex justify-between items-center px-8 z-10 shrink-0">
      <h2 className="text-xl font-semibold text-mac-gray-900">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-mac-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrency('COP')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              currency === 'COP'
                ? 'bg-white shadow-mac-sm text-mac-gray-900'
                : 'text-mac-gray-500 hover:text-mac-gray-700'
            }`}
          >
            COP
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              currency === 'USD'
                ? 'bg-white shadow-mac-sm text-mac-gray-900'
                : 'text-mac-gray-500 hover:text-mac-gray-700'
            }`}
          >
            USD
          </button>
        </div>

        <NotificationDropdown onNavigate={onNavigate} />
      </div>
    </header>
  );
}
