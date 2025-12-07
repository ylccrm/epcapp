import { ReactNode, useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-50 text-slate-800 antialiased h-screen flex overflow-hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
        <Header
          title={headerTitle}
          onNewProject={onNewProject}
          onNavigate={onNavigate}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
