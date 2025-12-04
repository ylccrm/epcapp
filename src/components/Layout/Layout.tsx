import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  headerTitle: string;
  onNewProject?: () => void;
}

export function Layout({ children, currentView, onNavigate, headerTitle, onNewProject }: LayoutProps) {
  return (
    <div className="bg-gray-50 text-slate-800 antialiased h-screen flex overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
        <Header title={headerTitle} onNewProject={onNewProject} />

        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
