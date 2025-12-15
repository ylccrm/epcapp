import { useEffect, useState, useRef } from 'react';
import { Search, Plus, MapPin, MoreHorizontal, ChevronLeft, ChevronRight, Grid, List, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CreateProjectModal } from '../Modals/CreateProjectModal';
import { useToast } from '../../contexts/ToastContext';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProjects();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      let countQuery = supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (searchTerm) {
        countQuery = countQuery.ilike('name', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;

      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject(projectId: string, projectName: string) {
    if (!confirm(`¿Está seguro de que desea eliminar el proyecto "${projectName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeletingId(projectId);
      setOpenMenuId(null);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      showToast('Proyecto eliminado exitosamente', 'success');
      await loadProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      showToast(error.message || 'Error al eliminar el proyecto', 'error');
    } finally {
      setDeletingId(null);
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
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition ${
                viewMode === 'grid'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vista de tarjetas"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition ${
                viewMode === 'list'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Vista de lista"
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition flex items-center gap-2"
          >
            <Plus size={16} />
            Crear Proyecto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando proyectos...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No se encontraron proyectos</div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const progress = Math.round(project.avg_progress || 0);
                const isDeleting = deletingId === project.id;
                return (
                  <div
                    key={project.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition ${
                      isDeleting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${getStatusBadge(project.status)}`}>
                        {project.status === 'draft' ? 'Borrador' :
                         project.status === 'execution' ? 'Ejecución' :
                         'Finalizado'}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === project.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                onNavigate('project-detail', project.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye size={14} />
                              Ver detalles
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id, project.name);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Eliminar proyecto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      onClick={() => onNavigate('project-detail', project.id)}
                      className="cursor-pointer"
                    >
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
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => {
                    const progress = Math.round(project.avg_progress || 0);
                    const isDeleting = deletingId === project.id;
                    return (
                      <tr
                        key={project.id}
                        className={`hover:bg-gray-50 transition ${
                          isDeleting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <td
                          onClick={() => onNavigate('project-detail', project.id)}
                          className="px-6 py-4 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{project.client}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            {project.location || 'Sin ubicación'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold ${getStatusBadge(project.status)}`}>
                            {project.status === 'draft' ? 'Borrador' :
                             project.status === 'execution' ? 'Ejecución' :
                             'Finalizado'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-800 min-w-[35px]">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === project.id ? null : project.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openMenuId === project.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    onNavigate('project-detail', project.id);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye size={14} />
                                  Ver detalles
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.id, project.name);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Eliminar proyecto
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
}
