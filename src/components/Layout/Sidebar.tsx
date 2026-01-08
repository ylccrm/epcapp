import { useState } from 'react';
import { Sun, PieChart, Building2, Warehouse, DollarSign, Settings, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userProfile: UserProfile | null;
}

export function Sidebar({ currentView, onNavigate, userProfile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: PieChart, label: 'Dashboard', section: 'Gestion', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'projects', icon: Building2, label: 'Proyectos', section: 'Gestion', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'inventory', icon: Warehouse, label: 'Almacen Central', section: 'Gestion', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'payments', icon: DollarSign, label: 'Pagos', section: 'Gestion', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'providers', icon: Settings, label: 'Proveedores', section: 'Admin', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'users', icon: Users, label: 'Usuarios', section: 'Admin', roles: ['admin'] },
  ];

  const sections = ['Gestion', 'Admin'];

  const filteredNavItems = navItems.filter(item =>
    !userProfile || item.roles.includes(userProfile.role)
  );

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-mac-gray-200 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out fixed md:relative h-full`}
    >
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} border-b border-mac-gray-200 bg-white transition-all duration-300`}>
        {!isCollapsed && (
          <>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mac-blue-500 to-mac-blue-600 flex items-center justify-center mr-3 shadow-mac">
              <Sun className="text-white" size={20} />
            </div>
            <span className="text-mac-gray-900 font-semibold text-lg tracking-tight">
              Solar<span className="text-mac-blue-500">EPC</span>
            </span>
          </>
        )}
        {isCollapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mac-blue-500 to-mac-blue-600 flex items-center justify-center shadow-mac">
            <Sun className="text-white" size={20} />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const sectionItems = filteredNavItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section}>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-semibold text-mac-gray-400 uppercase tracking-wider mb-2 mt-5 first:mt-0">
                  {section}
                </p>
              )}
              {isCollapsed && sectionItems.length > 0 && (
                <div className="h-px bg-mac-gray-200 my-4 first:mt-0"></div>
              )}
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2' : 'px-3'
                    } py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-mac-blue-500 text-white shadow-mac'
                        : 'text-mac-gray-600 hover:bg-mac-gray-100 hover:text-mac-gray-900'
                    }`}
                  >
                    <Icon
                      className={`${isCollapsed ? '' : 'mr-3'} transition-colors`}
                      size={20}
                    />
                    {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-mac-gray-200 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center w-full mb-3">
            <img
              className="h-9 w-9 rounded-full ring-2 ring-mac-blue-100"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Usuario')}&background=007AFF&color=fff`}
              alt="User"
            />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-mac-gray-900 truncate">
                {userProfile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-mac-gray-500">
                {userProfile?.role === 'admin' && 'Super Admin'}
                {userProfile?.role === 'supervisor' && 'Supervisor'}
                {userProfile?.role === 'installer' && 'Instalador'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <img
              className="h-9 w-9 rounded-full ring-2 ring-mac-blue-500"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Usuario')}&background=007AFF&color=fff`}
              alt="User"
              title={userProfile?.full_name || 'Usuario'}
            />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg bg-mac-gray-100 hover:bg-mac-blue-500 hover:text-white text-mac-gray-600 transition-all duration-200 group"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} className="mr-2" />
              <span className="text-sm font-medium">Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
