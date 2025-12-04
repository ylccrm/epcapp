import { Sun, PieChart, Building2, Warehouse, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: PieChart, label: 'Dashboard', section: 'Gestión' },
    { id: 'projects', icon: Building2, label: 'Proyectos', section: 'Gestión' },
    { id: 'inventory', icon: Warehouse, label: 'Almacén Central', section: 'Gestión' },
    { id: 'providers', icon: Settings, label: 'Proveedores', section: 'Admin' },
  ];

  const sections = ['Gestión', 'Admin'];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
        <Sun className="text-yellow-500 text-xl mr-3" size={24} />
        <span className="text-white font-bold text-lg tracking-wide">
          Solar<span className="text-yellow-500">EPC</span>
        </span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section}>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
              {section}
            </p>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-6 mr-3 transition-colors ${
                        isActive ? 'text-yellow-500' : 'group-hover:text-yellow-500'
                      }`}
                      size={20}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center w-full">
          <img
            className="h-9 w-9 rounded-full border border-slate-600"
            src="https://ui-avatars.com/api/?name=Admin+User&background=f59e0b&color=fff"
            alt="User"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Ing. Jefe</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
