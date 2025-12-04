import { useEffect, useState } from 'react';
import { ArrowUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface DashboardProps {
  onNavigate: (view: string, projectId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { formatAmount } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'execution')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.total_budget_usd), 0);

  return (
    <div className="fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Flujo de Caja (Mes)
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-bold text-slate-800">{formatAmount(125000)}</h3>
            <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-0.5 rounded flex items-center">
              <ArrowUp size={14} /> 12%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Pagos Pendientes
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-bold text-slate-800">{formatAmount(45200)}</h3>
            <span className="text-orange-600 text-sm font-bold bg-orange-50 px-2 py-0.5 rounded">
              3 Vencen hoy
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Proyectos Activos
          </p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{projects.length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Proyectos en Ejecución Recientes</h3>
          <button
            onClick={() => onNavigate('projects')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando proyectos...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay proyectos en ejecución</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Proyecto</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Fase</th>
                <th className="px-6 py-3 text-right">Presupuesto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => onNavigate('project-detail', project.id)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{project.name}</td>
                  <td className="px-6 py-4 text-gray-500">{project.client}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                      {project.status === 'execution' ? 'Ejecución' : project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">
                    {formatAmount(Number(project.total_budget_usd))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
