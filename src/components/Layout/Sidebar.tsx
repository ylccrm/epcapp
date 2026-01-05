import { useState } from 'react';
import { Sun, PieChart, Building2, Warehouse, Settings, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
    { id: 'dashboard', icon: PieChart, label: 'Dashboard', section: 'Gestión', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'projects', icon: Building2, label: 'Proyectos', section: 'Gestión', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'inventory', icon: Warehouse, label: 'Almacén Central', section: 'Gestión', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'providers', icon: Settings, label: 'Proveedores', section: 'Admin', roles: ['admin', 'supervisor', 'installer'] },
    { id: 'users', icon: Users, label: 'Usuarios', section: 'Admin', roles: ['admin'] },
  ];

  const sections = ['Gestión', 'Admin'];

  const filteredNavItems = navItems.filter(item =>
    !userProfile || item.roles.includes(userProfile.role)
  );

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] flex flex-col shadow-2xl z-20 shrink-0 transition-all duration-300 ease-in-out fixed md:relative h-full`}
    >
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} bg-[var(--bg-sidebar-header)] border-b border-[var(--border-sidebar)] transition-all duration-300`}>
        {!isCollapsed && (
          <>
            <Sun className="text-yellow-500 text-xl mr-3" size={24} />
            <span className="text-white font-bold text-lg tracking-wide">
              Solar<span className="text-yellow-500">EPC</span>
            </span>
          </>
        )}
        {isCollapsed && <Sun className="text-yellow-500" size={24} />}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const sectionItems = filteredNavItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section}>
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                  {section}
                </p>
              )}
              {isCollapsed && sectionItems.length > 0 && (
                <div className="h-px bg-[var(--border-sidebar)] my-4 first:mt-0"></div>
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
                        ? 'bg-[var(--accent-green-500)] text-[var(--text-sidebar-active)] shadow-glow-green'
                        : 'hover:bg-[var(--bg-sidebar-hover)] hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`${isCollapsed ? '' : 'mr-3'} transition-colors ${
                        isActive ? 'text-[var(--text-sidebar-active)]' : ''
                      }`}
                      size={20}
                    />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-[var(--border-sidebar)] bg-[var(--bg-sidebar)]`}>
        {!isCollapsed ? (
          <div className="flex items-center w-full mb-3">
            <img
              className="h-9 w-9 rounded-full border border-slate-600"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Usuario')}&background=10b981&color=fff`}
              alt="User"
            />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400">
                {userProfile?.role === 'admin' && 'Super Admin'}
                {userProfile?.role === 'supervisor' && 'Supervisor'}
                {userProfile?.role === 'installer' && 'Instalador'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <img
              className="h-9 w-9 rounded-full border-2 border-[var(--accent-green-500)]"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Usuario')}&background=10b981&color=fff`}
              alt="User"
              title={userProfile?.full_name || 'Usuario'}
            />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg bg-[var(--bg-sidebar-hover)] hover:bg-[var(--accent-green-500)] hover:text-[var(--text-sidebar-active)] transition-all duration-200 group"
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
