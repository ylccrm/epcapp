import { useState } from 'react';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Views/Dashboard';
import { Projects } from './components/Views/Projects';
import { Inventory } from './components/Views/Inventory';
import { Payments } from './components/Views/Payments';
import { Suppliers } from './components/Views/Suppliers';
import { Users } from './components/Views/Users';
import { ProjectDetail } from './components/Views/ProjectDetail/ProjectDetail';
import { CreateProjectModal } from './components/Modals/CreateProjectModal';

type ViewType = 'dashboard' | 'projects' | 'inventory' | 'payments' | 'providers' | 'users' | 'project-detail';

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
      case 'payments':
        return 'Control de Pagos';
      case 'providers':
        return 'Gestión de Proveedores';
      case 'users':
        return 'Gestión de Usuarios';
      case 'project-detail':
        return 'Gestión de Proyecto';
      default:
        return 'SolarEPC';
    }
  };


  return (
    <CurrencyProvider>
      <ToastProvider>
        {/* Banner de Éxito - Test de Despliegue Automático */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          🎉 ¡LO LOGRAMOS! - Despliegue Automático Funcionando 🚀
        </div>
        
        <Layout
          currentView={currentView}
          onNavigate={handleNavigate}
          headerTitle={getHeaderTitle()}
          onNewProject={() => setIsModalOpen(true)}
          userProfile={null}
        >
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} key={`dashboard-${refreshTrigger}`} />
          )}
          {currentView === 'projects' && (
            <Projects onNavigate={handleNavigate} key={`projects-${refreshTrigger}`} />
          )}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'payments' && <Payments />}
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

export default App;
