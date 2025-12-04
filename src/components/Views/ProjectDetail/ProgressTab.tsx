import { useEffect, useState } from 'react';
import { FileText, Camera, Paperclip } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { UploadEvidenceModal } from '../../Modals/UploadEvidenceModal';
import type { Database } from '../../../lib/database.types';

type Milestone = Database['public']['Tables']['project_milestones']['Row'];

interface ProgressTabProps {
  projectId: string;
}

const STANDARD_MILESTONES = [
  { name: '1. Ingeniería y Diseños', defaultSubcontractor: 'Ingeniería & Diseños S.A.S' },
  { name: '2. Instalación de Estructura', defaultSubcontractor: 'Equipo Alpha' },
  { name: '3. Líneas de Vida (HSE)', defaultSubcontractor: 'Seguridad Alturas Ltda' },
  { name: '4. Instalación Bandejería', defaultSubcontractor: 'Montajes del Norte' },
  { name: '5. Instalación Cableado DC/AC', defaultSubcontractor: 'Montajes del Norte' },
  { name: '6. Instalación Paneles Solares', defaultSubcontractor: 'Equipo Alpha' },
  { name: '7. Apantallamiento (Pararrayos)', defaultSubcontractor: 'Montajes del Norte' },
];

export function ProgressTab({ projectId }: ProgressTabProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  async function loadMilestones() {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        await initializeMilestones();
      } else {
        setMilestones(data);
        calculateTotalProgress(data);
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeMilestones() {
    try {
      const newMilestones = STANDARD_MILESTONES.map((m, index) => ({
        project_id: projectId,
        name: m.name,
        progress_percentage: 0,
        subcontractor_name: m.defaultSubcontractor,
        order_index: index + 1,
      }));

      const { data, error } = await supabase
        .from('project_milestones')
        .insert(newMilestones)
        .select();

      if (error) throw error;
      setMilestones(data || []);
      calculateTotalProgress(data || []);
    } catch (error) {
      console.error('Error initializing milestones:', error);
    }
  }

  function calculateTotalProgress(milestonesData: Milestone[]) {
    if (milestonesData.length === 0) {
      setTotalProgress(0);
      return;
    }
    const total = milestonesData.reduce((sum, m) => sum + m.progress_percentage, 0);
    const avg = Math.round(total / milestonesData.length);
    setTotalProgress(avg);
  }

  async function updateMilestoneProgress(milestoneId: string, newProgress: number) {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({ progress_percentage: newProgress })
        .eq('id', milestoneId);

      if (error) throw error;

      const updatedMilestones = milestones.map((m) =>
        m.id === milestoneId ? { ...m, progress_percentage: newProgress } : m
      );
      setMilestones(updatedMilestones);
      calculateTotalProgress(updatedMilestones);
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  }

  async function updateSubcontractor(milestoneId: string, subcontractor: string) {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({ subcontractor_name: subcontractor })
        .eq('id', milestoneId);

      if (error) throw error;

      const updatedMilestones = milestones.map((m) =>
        m.id === milestoneId ? { ...m, subcontractor_name: subcontractor } : m
      );
      setMilestones(updatedMilestones);
    } catch (error) {
      console.error('Error updating subcontractor:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando hitos...</div>;
  }

  return (
    <div>
      <div className="bg-slate-900 rounded-xl p-6 text-white mb-6 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-slate-200">Avance Físico Total</h3>
          <p className="text-xs text-slate-400">Promedio ponderado de hitos instalados</p>
          <h2 className="text-4xl font-bold mt-2 text-yellow-400">{totalProgress}%</h2>
        </div>
        <div className="relative z-10 text-right">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 text-sm font-bold px-4 py-2 rounded shadow-lg transition flex items-center gap-2">
            <FileText size={16} />
            Reporte Avance
          </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-slate-800 to-transparent opacity-50"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-slate-700">Control de Hitos de Obra</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <div className="w-full md:w-1/3">
                  <h4 className="font-bold text-slate-800 text-sm">{milestone.name}</h4>
                  <input
                    type="text"
                    value={milestone.subcontractor_name || ''}
                    onChange={(e) => updateSubcontractor(milestone.id, e.target.value)}
                    placeholder="Subcontratista"
                    className="mt-1 text-xs border border-gray-300 rounded px-2 py-1 bg-white w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="w-full md:w-1/3 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={milestone.progress_percentage}
                    onChange={(e) => updateMilestoneProgress(milestone.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <span className="text-sm font-bold w-12 text-right">
                    {milestone.progress_percentage}%
                  </span>
                </div>
                <div className="w-full md:w-auto text-right">
                  {milestone.progress_percentage > 0 ? (
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setIsModalOpen(true);
                      }}
                      className="text-xs bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition"
                    >
                      <Camera size={12} />
                      Foto
                    </button>
                  ) : (
                    <button className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded cursor-not-allowed">
                      Pendiente
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMilestone && (
        <UploadEvidenceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMilestone(null);
          }}
          milestoneId={selectedMilestone.id}
          milestoneName={selectedMilestone.name}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedMilestone(null);
          }}
        />
      )}
    </div>
  );
}
