import { Bell, Plus } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface HeaderProps {
  title: string;
  onNewProject?: () => void;
}

export function Header({ title, onNewProject }: HeaderProps) {
  const { currency, setCurrency } = useCurrency();

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
          <Bell className="text-gray-400 hover:text-gray-600 cursor-pointer" size={20} />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </div>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        {onNewProject && (
          <button
            onClick={onNewProject}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-slate-900/20 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Proyecto
          </button>
        )}
      </div>
    </header>
  );
}
