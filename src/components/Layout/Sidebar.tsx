import { Sun, PieChart, Building2, Warehouse, Users, Settings, X, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentView, onNavigate, isOpen = true, onClose }: SidebarProps) {
  const { user, userProfile } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: PieChart, label: 'Dashboard', section: 'Gestión' },
    { id: 'projects', icon: Building2, label: 'Proyectos', section: 'Gestión' },
    { id: 'invitations', icon: Mail, label: 'Invitaciones', section: 'Gestión' },
    { id: 'inventory', icon: Warehouse, label: 'Almacén Central', section: 'Gestión' },
    { id: 'providers', icon: Users, label: 'Proveedores', section: 'Admin' },
    { id: 'settings', icon: Settings, label: 'Configuración', section: 'Admin' },
  ];

  const sections = ['Gestión', 'Admin'];

  const handleNavigation = (view: string) => {
    onNavigate(view);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0
        w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
        text-slate-300 flex flex-col shadow-2xl z-50 shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sun size={22} className="text-slate-900" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Solar<span className="text-amber-400">EPC</span>
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {sections.map((section) => (
            <div key={section} className="mb-6">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                {section}
              </p>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`
                        w-full flex items-center px-4 py-3 rounded-xl
                        transition-all duration-200 group relative overflow-hidden
                        ${
                          isActive
                            ? 'bg-amber-400/10 text-white'
                            : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                        }
                      `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full" />
                        )}
                        <Icon
                          className={`
                          w-5 h-5 mr-3 transition-all duration-200
                          ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'}
                        `}
                        />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center ring-2 ring-slate-700">
              <span className="text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[11px] text-slate-400 font-medium">
                {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'supervisor' ? 'Supervisor' : 'Instalador'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
