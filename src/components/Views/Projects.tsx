import { useEffect, useState } from 'react';
import { Search, Plus, MapPin, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  avg_progress: number;
};

interface ProjectsProps {
  onNavigate: (view: string, projectId?: string) => void;
}

const PAGE_SIZE = 12;

export function Projects({ onNavigate }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [currentPage, searchTerm, statusFilter]);

  async function loadProjects() {
    try {
      setLoading(true);

      let query = supabase.rpc('get_projects_with_progress', {
        search_term: searchTerm || null,
        status_filter: statusFilter === 'all' ? null : statusFilter,
        page_offset: (currentPage - 1) * PAGE_SIZE,
        page_limit: PAGE_SIZE
      });

      const { data, error } = await query;

      if (error) throw error;

      setProjects(data || []);

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`)
        .eq(statusFilter !== 'all' ? 'status' : 'id', statusFilter !== 'all' ? statusFilter : projects[0]?.id || '');

      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={14} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
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
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No se encontraron proyectos</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = Math.round(project.avg_progress || 0);
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
