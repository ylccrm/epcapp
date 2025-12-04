import { useState } from 'react';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Views/Dashboard';
import { Projects } from './components/Views/Projects';
import { Inventory } from './components/Views/Inventory';
import { ProjectDetail } from './components/Views/ProjectDetail/ProjectDetail';
import { CreateProjectModal } from './components/Modals/CreateProjectModal';

type ViewType = 'dashboard' | 'projects' | 'inventory' | 'project-detail';

function App() {
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
      case 'inventory':
        return 'Almacén Central';
      case 'project-detail':
        return 'Gestión de Proyecto';
      default:
        return 'SolarEPC';
    }
  };

  return (
    <CurrencyProvider>
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
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'project-detail' && selectedProjectId && (
          <ProjectDetail projectId={selectedProjectId} onNavigate={handleNavigate} />
        )}
      </Layout>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </CurrencyProvider>
  );
}

export default App;
