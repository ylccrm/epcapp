import { useEffect, useState } from 'react';
import { Search, Plus, MapPin, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsProps {
  onNavigate: (view: string, projectId?: string) => void;
}

export function Projects({ onNavigate }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});

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

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={14} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="execution">En Ejecución</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition flex items-center gap-2">
          <Plus size={16} />
          Crear Proyecto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando proyectos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No se encontraron proyectos</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = projectProgress[project.id] || 0;
            return (
              <div
                key={project.id}
                onClick={() => onNavigate('project-detail', project.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${getStatusBadge(project.status)}`}>
                    {project.status === 'draft' ? 'Borrador' :
                     project.status === 'execution' ? 'Ejecución' :
                     'Finalizado'}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                  <MapPin size={14} />
                  {project.location || 'Sin ubicación'}
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progreso</span>
                    <span className="font-medium text-slate-800">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium text-slate-800">{project.client}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
