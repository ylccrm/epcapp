import { useEffect, useState } from 'react';
import { ArrowLeft, ListTodo, DollarSign, Package, Server, Users, FolderOpen, Share2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProjectCurrency } from '../../../hooks/useProjectCurrency';
import type { Database } from '../../../lib/database.types';
import { ProgressTab } from './ProgressTab';
import { PaymentsTab } from './PaymentsTab';
import { MaterialsTab } from './MaterialsTab';
import { EquipmentTab } from './EquipmentTab';
import { CrewsTab } from './CrewsTab';
import { DocsTab } from './DocsTab';
import { ShareProjectModal } from '../../Modals/ShareProjectModal';

type Project = Database['public']['Tables']['projects']['Row'];
type TabType = 'progress' | 'payments' | 'materials' | 'equipment' | 'crews' | 'docs';

interface ProjectDetailProps {
  projectId: string;
  onNavigate: (view: string) => void;
}

export function ProjectDetail({ projectId, onNavigate }: ProjectDetailProps) {
  const { formatAmount } = useProjectCurrency(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProject({ ...project, status: newStatus });
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error al actualizar el estado del proyecto');
    }
  }

  const tabs = [
    { id: 'progress', label: 'Ejecución & Avance', icon: ListTodo },
    { id: 'payments', label: 'Pagos & Contratos', icon: DollarSign },
    { id: 'materials', label: 'Inventario & Compras', icon: Package },
    { id: 'equipment', label: 'Equipos', icon: Server },
    { id: 'crews', label: 'Cuadrillas', icon: Users },
    { id: 'docs', label: 'Documentación', icon: FolderOpen },
  ];

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Borrador',
      execution: 'En Ejecución',
      finished: 'Finalizado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      execution: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      finished: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando proyecto...</div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Proyecto no encontrado</div>;
  }

  return (
    <div className="fade-in pb-20">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button
          onClick={() => onNavigate('projects')}
          className="hover:text-slate-800 flex items-center gap-1 transition"
        >
          <ArrowLeft size={16} />
          Volver a Proyectos
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">{project.name}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">
                {project.name}
              </h1>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 ${getStatusColor(project.status)}`}
              >
                <option value="draft">Borrador</option>
                <option value="execution">En Ejecución</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Cliente: {project.client} | Ubicación: {project.location || 'Sin especificar'}
            </p>
          </div>
          <div className="flex items-start gap-4">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-md"
              title="Compartir proyecto con otros usuarios"
            >
              <Share2 size={16} />
              Compartir
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500">Presupuesto Total</p>
              <div className="text-2xl font-bold text-slate-800">
                {formatAmount(Number(project.total_budget_usd))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6 flex gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 text-sm flex items-center gap-2 transition px-2 whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-yellow-500 text-slate-800 font-semibold'
                  : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="fade-in">
        {activeTab === 'progress' && <ProgressTab projectId={projectId} />}
        {activeTab === 'payments' && <PaymentsTab projectId={projectId} />}
        {activeTab === 'materials' && <MaterialsTab projectId={projectId} />}
        {activeTab === 'equipment' && <EquipmentTab projectId={projectId} />}
        {activeTab === 'crews' && <CrewsTab projectId={projectId} />}
        {activeTab === 'docs' && <DocsTab projectId={projectId} />}
      </div>

      {project && (
        <ShareProjectModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          projectId={projectId}
          projectName={project.name}
        />
      )}
    </div>
  );
}
