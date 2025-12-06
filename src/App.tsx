import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Views/Dashboard';
import { Projects } from './components/Views/Projects';
import { Inventory } from './components/Views/Inventory';
import { Suppliers } from './components/Views/Suppliers';
import { Settings } from './components/Views/Settings';
import { AuditLog } from './components/Views/AuditLog';
import { Invitations } from './components/Views/Invitations';
import { ProjectDetail } from './components/Views/ProjectDetail/ProjectDetail';
import { InstallerView } from './components/Views/InstallerView';
import { CreateProjectModal } from './components/Modals/CreateProjectModal';
import { AuthPage } from './components/Auth/AuthPage';

type ViewType = 'dashboard' | 'projects' | 'invitations' | 'inventory' | 'providers' | 'settings' | 'audit' | 'project-detail';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
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
        return 'Panel de Control';
      case 'projects':
        return 'Cartera de Proyectos';
      case 'invitations':
        return 'Invitaciones de Proyectos';
      case 'inventory':
        return 'Almacén Central';
      case 'providers':
        return 'Gestión de Proveedores';
      case 'settings':
        return 'Configuración del Sistema';
      case 'audit':
        return 'Registro de Auditoría';
      case 'project-detail':
        return 'Gestión de Proyecto';
      default:
        return 'SolarEPC';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (userProfile?.role === 'installer' || userProfile?.role === 'supervisor') {
    return (
      <ToastProvider>
        <InstallerView />
      </ToastProvider>
    );
  }

  return (
    <CurrencyProvider>
      <ToastProvider>
        <Layout
          currentView={currentView}
          onNavigate={handleNavigate}
          headerTitle={getHeaderTitle()}
          onNewProject={() => setIsModalOpen(true)}
        >
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} key={`dashboard-${refreshTrigger}`} />
          )}
          {currentView === 'projects' && (
            <Projects onNavigate={handleNavigate} key={`projects-${refreshTrigger}`} />
          )}
          {currentView === 'invitations' && <Invitations />}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'providers' && <Suppliers />}
          {currentView === 'settings' && <Settings />}
          {currentView === 'audit' && <AuditLog />}
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
