import { Plus, LogOut, User, Activity, Menu } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';

interface HeaderProps {
  title: string;
  onNewProject?: () => void;
  onNavigate?: (view: string, projectId?: string) => void;
  onMenuToggle?: () => void;
}

export function Header({ title, onNewProject, onNavigate, onMenuToggle }: HeaderProps) {
  const { currency, setCurrency } = useCurrency();
  const { user, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="h-20 bg-white/80 apple-glass border-b border-gray-200/50 flex justify-between items-center px-6 md:px-8 z-50 shrink-0 sticky top-0">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={24} className="text-slate-800" />
          </button>
        )}
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center bg-gray-100/80 rounded-xl p-1">
          <button
            onClick={() => setCurrency('COP')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currency === 'COP'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            COP
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currency === 'USD'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            USD
          </button>
        </div>

        <NotificationDropdown onNavigate={onNavigate} />

        {userProfile?.role === 'admin' && onNavigate && (
          <button
            onClick={() => onNavigate('audit')}
            className="hidden md:flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            title="Registro de Auditoría"
          >
            <Activity size={20} />
          </button>
        )}

        {onNewProject && (
          <button
            onClick={onNewProject}
            className="hidden md:flex apple-button-primary items-center gap-2"
          >
            <Plus size={18} />
            <span>Nuevo Proyecto</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-3 pl-4 ml-4 border-l border-gray-200">
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="font-medium text-slate-800 max-w-[150px] truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
