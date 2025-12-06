import { useEffect, useState } from 'react';
import { Search, Plus, MapPin, MoreHorizontal, Share2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ShareProjectModal } from '../Modals/ShareProjectModal';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsProps {
  onNavigate: (view: string, projectId?: string) => void;
}

export function Projects({ onNavigate }: ProjectsProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      if (data) {
        for (const project of data) {
          await calculateProjectProgress(project.id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function calculateProjectProgress(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('progress_percentage')
        .eq('project_id', projectId);

      if (error) throw error;

      if (data && data.length > 0) {
        const total = data.reduce((sum, m) => sum + m.progress_percentage, 0);
        const avg = Math.round(total / data.length);
        setProjectProgress((prev) => ({ ...prev, [projectId]: avg }));
      } else {
        setProjectProgress((prev) => ({ ...prev, [projectId]: 0 }));
      }
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      execution: 'bg-blue-100 text-blue-800',
      finished: 'bg-green-100 text-green-800',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const isProjectShared = (project: Project) => {
    return project.shared_with && project.shared_with.length > 0;
  };

  const isProjectOwner = (project: Project) => {
    return project.created_by === user?.id;
  };

  const handleShareClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setShareModalOpen(true);
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="apple-input w-full sm:w-64 pl-10 py-2.5"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="apple-input py-2.5"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="execution">En Ejecución</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando proyectos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No se encontraron proyectos</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = projectProgress[project.id] || 0;
            const isOwner = isProjectOwner(project);
            const isShared = isProjectShared(project);

            return (
              <div
                key={project.id}
                onClick={() => onNavigate('project-detail', project.id)}
                className="apple-card p-5 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(project.status)}`}>
                      {project.status === 'draft' ? 'Borrador' :
                       project.status === 'execution' ? 'Ejecución' :
                       'Finalizado'}
                    </span>
                    {isShared && (
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Users size={12} />
                        Compartido
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={(e) => handleShareClick(e, project)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                      title="Compartir proyecto"
                    >
                      <Share2 size={16} className="text-slate-600" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <MapPin size={14} />
                  {project.location || 'Sin ubicación'}
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progreso del proyecto</span>
                    <span className="font-semibold text-slate-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-semibold text-slate-900">{project.client}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProject && (
        <ShareProjectModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject.id}
          projectName={selectedProject.client}
        />
      )}
    </div>
  );
}
