import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Views/Dashboard';
import { Projects } from './components/Views/Projects';
import { Inventory } from './components/Views/Inventory';
import { Suppliers } from './components/Views/Suppliers';
import { Users } from './components/Views/Users';
import { ProjectDetail } from './components/Views/ProjectDetail/ProjectDetail';
import { CreateProjectModal } from './components/Modals/CreateProjectModal';
import { AuthPage } from './components/Auth/AuthPage';

type ViewType = 'dashboard' | 'projects' | 'inventory' | 'providers' | 'users' | 'project-detail';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNavigate = (view: string, projectId?: string) => {
    setCurrentView(view as ViewType);
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  };

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleNavigate('projects');
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return t('dashboard.title');
      case 'projects':
        return t('projects.title');
      case 'inventory':
        return t('inventory.title');
      case 'providers':
        return t('suppliers.title');
      case 'users':
        return t('users.title');
      case 'project-detail':
        return t('projects.details');
      default:
        return 'SolarEPC';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <CurrencyProvider>
      <ToastProvider>
        <Layout
          currentView={currentView}
          onNavigate={handleNavigate}
          headerTitle={getHeaderTitle()}
          onNewProject={() => setIsModalOpen(true)}
          userProfile={userProfile}
        >
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} key={`dashboard-${refreshTrigger}`} />
          )}
          {currentView === 'projects' && (
            <Projects onNavigate={handleNavigate} key={`projects-${refreshTrigger}`} />
          )}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'providers' && <Suppliers />}
          {currentView === 'users' && <Users />}
          {currentView === 'project-detail' && selectedProjectId && (
            <ProjectDetail projectId={selectedProjectId} onNavigate={handleNavigate} />
          )}
        </Layout>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      </ToastProvider>
    </CurrencyProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
