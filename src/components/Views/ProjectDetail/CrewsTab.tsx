import { useEffect, useState } from 'react';
import { HardHat, Plus, Phone } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AssignCrewModal } from '../../Modals/AssignCrewModal';
import type { Database } from '../../../lib/database.types';

type ProjectCrew = Database['public']['Tables']['project_crews']['Row'];

interface CrewsTabProps {
  projectId: string;
}

export function CrewsTab({ projectId }: CrewsTabProps) {
  const [crews, setCrews] = useState<ProjectCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCrews();
  }, [projectId]);

  async function loadCrews() {
    try {
      const { data, error } = await supabase
        .from('project_crews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrews(data || []);
    } catch (error) {
      console.error('Error loading crews:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      on_leave: 'De Descanso',
    };
    return labels[status as keyof typeof labels] || 'Activo';
  };

  const getSpecialtyLabel = (specialty: string | null) => {
    if (!specialty) return '';
    const labels = {
      instalacion: 'Instalación',
      electrico: 'Eléctrico',
      montaje: 'Montaje',
      supervision: 'Supervisión',
    };
    return labels[specialty as keyof typeof labels] || specialty;
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Personal Asignado</h3>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Cargando equipos...</div>
        ) : (
          <div className="space-y-4">
            {crews.map((crew) => (
              <div
                key={crew.id}
                className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50"
              >
                <div className="bg-white p-2 rounded shadow-sm">
                  <HardHat className="text-orange-500" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">{crew.name}</h4>
                      {crew.specialty && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">
                          {getSpecialtyLabel(crew.specialty)}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold h-fit ${getStatusBadge(crew.status)}`}>
                      {getStatusLabel(crew.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Líder: {crew.leader} | {crew.members_count} Técnicos
                  </p>
                  {crew.phone && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Phone size={12} />
                      {crew.phone}
                    </p>
                  )}
                  {crew.current_task && (
                    <p className="text-xs text-gray-400 mt-1">Tarea actual: {crew.current_task}</p>
                  )}
                </div>
              </div>
            ))}

            {crews.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No hay equipos asignados a este proyecto
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-400 hover:border-gray-400 text-sm font-medium flex items-center justify-center gap-1"
            >
              <Plus size={14} />
              Asignar Cuadrilla
            </button>
          </div>
        )}
      </div>

      <AssignCrewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSuccess={loadCrews}
      />
    </div>
  );
}
