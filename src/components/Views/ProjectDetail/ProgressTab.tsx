import { useEffect, useState } from 'react';
import { FileText, Camera, Paperclip, Image as ImageIcon, Video, Eye, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { UploadMilestoneEvidenceModal } from '../../Modals/UploadMilestoneEvidenceModal';
import { CreateMilestoneModal } from '../../Modals/CreateMilestoneModal';
import type { Database } from '../../../lib/database.types';

type Milestone = Database['public']['Tables']['project_milestones']['Row'];
type Evidence = Database['public']['Tables']['milestone_evidence']['Row'];

interface MilestoneWithEvidence extends Milestone {
  evidence_count: number;
}

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
  const [milestones, setMilestones] = useState<MilestoneWithEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneWithEvidence | null>(null);
  const [evidenceByMilestone, setEvidenceByMilestone] = useState<Record<string, Evidence[]>>({});
  const [showEvidenceFor, setShowEvidenceFor] = useState<string | null>(null);
  const [isCreateMilestoneModalOpen, setIsCreateMilestoneModalOpen] = useState(false);

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
        await loadEvidenceCounts(data);
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvidenceCounts(milestonesData: Milestone[]) {
    try {
      const milestonesWithCounts = await Promise.all(
        milestonesData.map(async (milestone) => {
          const { count } = await supabase
            .from('milestone_evidence')
            .select('*', { count: 'exact', head: true })
            .eq('milestone_id', milestone.id);

          return {
            ...milestone,
            evidence_count: count || 0,
          };
        })
      );

      setMilestones(milestonesWithCounts);
      calculateTotalProgress(milestonesWithCounts);
    } catch (error) {
      console.error('Error loading evidence counts:', error);
    }
  }

  async function loadMilestoneEvidence(milestoneId: string) {
    try {
      const { data, error } = await supabase
        .from('milestone_evidence')
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvidenceByMilestone(prev => ({
        ...prev,
        [milestoneId]: data || [],
      }));
    } catch (error) {
      console.error('Error loading evidence:', error);
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

      const milestonesWithCounts = (data || []).map(m => ({ ...m, evidence_count: 0 }));
      setMilestones(milestonesWithCounts);
      calculateTotalProgress(milestonesWithCounts);
    } catch (error) {
      console.error('Error initializing milestones:', error);
    }
  }

  function toggleEvidenceView(milestoneId: string) {
    if (showEvidenceFor === milestoneId) {
      setShowEvidenceFor(null);
    } else {
      setShowEvidenceFor(milestoneId);
      if (!evidenceByMilestone[milestoneId]) {
        loadMilestoneEvidence(milestoneId);
      }
    }
  }

  function getEvidenceIcon(fileType: string) {
    if (fileType === 'photo') return <ImageIcon size={14} />;
    if (fileType === 'video') return <Video size={14} />;
    return <FileText size={14} />;
  }

  function handleEvidenceUploadSuccess() {
    loadMilestones();
    if (selectedMilestone) {
      loadMilestoneEvidence(selectedMilestone.id);
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
          <button
            onClick={() => setIsCreateMilestoneModalOpen(true)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Hito
          </button>
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
                <div className="w-full md:w-auto flex gap-2">
                  {milestone.progress_percentage > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setIsModalOpen(true);
                        }}
                        className="text-xs bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition"
                      >
                        <Camera size={12} />
                        Subir
                      </button>
                      {milestone.evidence_count > 0 && (
                        <button
                          onClick={() => toggleEvidenceView(milestone.id)}
                          className="text-xs bg-green-50 border border-green-100 text-green-600 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-green-100 transition"
                        >
                          <Eye size={12} />
                          Ver ({milestone.evidence_count})
                        </button>
                      )}
                    </>
                  ) : (
                    <button className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded cursor-not-allowed">
                      Pendiente
                    </button>
                  )}
                </div>
              </div>

              {showEvidenceFor === milestone.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-4 px-4 pb-4">
                  <h5 className="text-xs font-semibold text-gray-600 uppercase mb-4 pt-2">
                    Evidencias Adjuntas ({evidenceByMilestone[milestone.id]?.length || 0})
                  </h5>
                  {evidenceByMilestone[milestone.id] ? (
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200"></div>

                      <div className="space-y-4">
                        {evidenceByMilestone[milestone.id].map((evidence, index) => {
                          const date = new Date(evidence.created_at);
                          const showDateHeader = index === 0 ||
                            new Date(evidenceByMilestone[milestone.id][index - 1].created_at).toDateString() !== date.toDateString();

                          return (
                            <div key={evidence.id}>
                              {showDateHeader && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="text-xs font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
                                    {date.toLocaleDateString('es-ES', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="flex-1 h-px bg-gray-300"></div>
                                </div>
                              )}

                              <div className="flex gap-3 relative">
                                <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
                                  {getEvidenceIcon(evidence.file_type)}
                                </div>

                                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800 mb-1">
                                        {evidence.file_name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {date.toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                      evidence.file_type === 'image' ? 'bg-green-100 text-green-700' :
                                      evidence.file_type === 'video' ? 'bg-purple-100 text-purple-700' :
                                      evidence.file_type === 'pdf' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {evidence.file_type?.toUpperCase() || 'FILE'}
                                    </span>
                                  </div>

                                  {evidence.description && (
                                    <p className="text-sm text-gray-700 mb-3 border-l-2 border-blue-200 pl-3">
                                      {evidence.description}
                                    </p>
                                  )}

                                  <div className="flex gap-2">
                                    <a
                                      href={evidence.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium flex items-center gap-2 transition shadow-sm"
                                    >
                                      <Eye size={14} />
                                      Ver Archivo
                                    </a>
                                    <a
                                      href={evidence.file_url}
                                      download
                                      className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded font-medium flex items-center gap-2 transition border border-blue-200"
                                    >
                                      <FileText size={14} />
                                      Descargar
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Cargando evidencias...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedMilestone && (
        <UploadMilestoneEvidenceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMilestone(null);
          }}
          milestoneId={selectedMilestone.id}
          milestoneName={selectedMilestone.name}
          onSuccess={handleEvidenceUploadSuccess}
        />
      )}

      <CreateMilestoneModal
        isOpen={isCreateMilestoneModalOpen}
        onClose={() => setIsCreateMilestoneModalOpen(false)}
        projectId={projectId}
        onSuccess={loadMilestones}
      />
    </div>
  );
}
