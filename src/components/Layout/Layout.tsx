import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { Database } from '../../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  headerTitle: string;
  onNewProject?: () => void;
  userProfile: UserProfile | null;
}

export function Layout({ children, currentView, onNavigate, headerTitle, onNewProject, userProfile }: LayoutProps) {
  return (
    <div className="bg-gray-50 text-slate-800 antialiased h-screen flex overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={onNavigate} userProfile={userProfile} />

      <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
        <Header title={headerTitle} onNewProject={onNewProject} onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
