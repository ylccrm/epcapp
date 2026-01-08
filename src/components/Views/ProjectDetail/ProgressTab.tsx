import { useEffect, useState } from 'react';
import {
  FileText,
  Camera,
  Image as ImageIcon,
  Video,
  Eye,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
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
  { name: '1. Ingenieria y Disenos', defaultSubcontractor: 'Ingenieria & Disenos S.A.S' },
  { name: '2. Instalacion de Estructura', defaultSubcontractor: 'Equipo Alpha' },
  { name: '3. Lineas de Vida (HSE)', defaultSubcontractor: 'Seguridad Alturas Ltda' },
  { name: '4. Instalacion Bandejeria', defaultSubcontractor: 'Montajes del Norte' },
  { name: '5. Instalacion Cableado DC/AC', defaultSubcontractor: 'Montajes del Norte' },
  { name: '6. Instalacion Paneles Solares', defaultSubcontractor: 'Equipo Alpha' },
  { name: '7. Apantallamiento (Pararrayos)', defaultSubcontractor: 'Montajes del Norte' },
];

export function ProgressTab({ projectId }: ProgressTabProps) {
  const [milestones, setMilestones] = useState<MilestoneWithEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneWithEvidence | null>(null);
  const [evidenceByMilestone, setEvidenceByMilestone] = useState<Record<string, Evidence[]>>({});
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
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

  function toggleMilestone(milestoneId: string) {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
      if (!evidenceByMilestone[milestoneId]) {
        loadMilestoneEvidence(milestoneId);
      }
    }
    setExpandedMilestones(newExpanded);
  }

  function getEvidenceIcon(fileType: string) {
    if (fileType === 'image' || fileType === 'photo') return ImageIcon;
    if (fileType === 'video') return Video;
    return FileText;
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

  const completedMilestones = milestones.filter(m => m.progress_percentage === 100).length;
  const inProgressMilestones = milestones.filter(m => m.progress_percentage > 0 && m.progress_percentage < 100).length;
  const pendingMilestones = milestones.filter(m => m.progress_percentage === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-3 border-mac-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 mac-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-mac-blue-500/10 to-transparent rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-mac-blue-500 flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-mac-gray-900">Avance Fisico Total</h2>
                    <p className="text-xs text-mac-gray-500">Promedio de hitos completados</p>
                  </div>
                </div>
              </div>

              <button className="mac-button mac-button-secondary text-sm flex items-center gap-2">
                <FileText size={16} />
                Generar Reporte
              </button>
            </div>

            <div className="flex items-end gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-4">
                  <h3 className="text-6xl font-semibold text-mac-blue-500">{totalProgress}</h3>
                  <span className="text-3xl font-medium text-mac-gray-400">%</span>
                </div>

                <div className="space-y-2">
                  <div className="mac-progress-bar h-3">
                    <div
                      className="mac-progress-bar-fill bg-gradient-to-r from-mac-blue-500 to-mac-blue-400 relative overflow-hidden"
                      style={{ width: `${totalProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-mac-gray-500">
                    <span>Inicio</span>
                    <span>Completado</span>
                  </div>
                </div>
              </div>

              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-mac-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - totalProgress / 100)}`}
                    className="text-mac-blue-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-mac-gray-900">{totalProgress}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mac-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Sparkles size={16} className="text-emerald-500" />
            </div>
            <h3 className="font-semibold text-mac-gray-900">Resumen</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Completados</p>
                  <p className="text-2xl font-bold text-emerald-700">{completedMilestones}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-mac-blue-50 border border-mac-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-mac-blue-500 flex items-center justify-center">
                  <Clock size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-mac-blue-600 font-medium">En Progreso</p>
                  <p className="text-2xl font-bold text-mac-blue-700">{inProgressMilestones}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-mac-gray-100 border border-mac-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-mac-gray-400 flex items-center justify-center">
                  <Circle size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-mac-gray-600 font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-mac-gray-700">{pendingMilestones}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCreateMilestoneModalOpen(true)}
            className="w-full mt-6 mac-button mac-button-primary text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Nuevo Hito
          </button>
        </div>
      </div>

      <div className="mac-card">
        <div className="p-5 border-b border-mac-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mac-blue-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-mac-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-mac-gray-900">Hitos del Proyecto</h3>
              <p className="text-xs text-mac-gray-500">{milestones.length} hitos totales</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-mac-gray-100">
          {milestones.map((milestone) => {
            const isExpanded = expandedMilestones.has(milestone.id);
            const progress = milestone.progress_percentage;
            const statusColor = progress === 100 ? 'emerald' : progress > 0 ? 'blue' : 'gray';

            return (
              <div key={milestone.id} className="hover:bg-mac-gray-50/50 transition-colors">
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${statusColor}-50 border border-${statusColor}-100 flex items-center justify-center shrink-0`}>
                      {progress === 100 ? (
                        <CheckCircle2 size={20} className={`text-${statusColor}-500`} />
                      ) : progress > 0 ? (
                        <Clock size={20} className={`text-${statusColor}-500`} />
                      ) : (
                        <Circle size={20} className={`text-${statusColor}-400`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-mac-gray-900 text-sm">{milestone.name}</h4>
                        <span className={`mac-badge mac-badge-${statusColor} text-xs`}>
                          {progress}%
                        </span>
                      </div>

                      <input
                        type="text"
                        value={milestone.subcontractor_name || ''}
                        onChange={(e) => updateSubcontractor(milestone.id, e.target.value)}
                        placeholder="Subcontratista"
                        className="mac-input text-xs py-1.5 max-w-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {progress > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-mac-blue-50 text-mac-blue-600 hover:bg-mac-blue-100 transition"
                            title="Subir evidencia"
                          >
                            <Upload size={16} />
                          </button>

                          {milestone.evidence_count > 0 && (
                            <button
                              onClick={() => toggleMilestone(milestone.id)}
                              className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition flex items-center gap-1.5 text-xs font-medium"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {milestone.evidence_count} evidencias
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progress}
                          onChange={(e) => updateMilestoneProgress(milestone.id, parseInt(e.target.value))}
                          className="flex-1 h-2 bg-mac-gray-200 rounded-full appearance-none cursor-pointer accent-mac-blue-500"
                        />
                        <span className="text-sm font-semibold text-mac-gray-900 w-12 text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-mac-gray-50 border-t border-mac-gray-100">
                    <div className="bg-white rounded-xl border border-mac-gray-200 p-5">
                      <h5 className="text-sm font-semibold text-mac-gray-900 mb-4 flex items-center gap-2">
                        <Camera size={16} className="text-mac-blue-500" />
                        Evidencias Adjuntas ({evidenceByMilestone[milestone.id]?.length || 0})
                      </h5>

                      {evidenceByMilestone[milestone.id] ? (
                        <div className="space-y-3">
                          {evidenceByMilestone[milestone.id].map((evidence) => {
                            const EvidenceIcon = getEvidenceIcon(evidence.file_type);
                            const date = new Date(evidence.created_at);

                            return (
                              <div
                                key={evidence.id}
                                className="flex items-start gap-3 p-4 rounded-xl bg-mac-gray-50 hover:bg-mac-blue-50/50 transition-colors border border-mac-gray-200"
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  evidence.file_type === 'image' || evidence.file_type === 'photo' ? 'bg-emerald-100 text-emerald-600' :
                                  evidence.file_type === 'video' ? 'bg-purple-100 text-purple-600' :
                                  'bg-mac-blue-100 text-mac-blue-600'
                                }`}>
                                  <EvidenceIcon size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="font-medium text-sm text-mac-gray-900 truncate">
                                      {evidence.file_name}
                                    </p>
                                    <span className={`mac-badge text-[10px] shrink-0 ${
                                      evidence.file_type === 'image' || evidence.file_type === 'photo' ? 'mac-badge-green' :
                                      evidence.file_type === 'video' ? 'bg-purple-100 text-purple-600' :
                                      'mac-badge-blue'
                                    }`}>
                                      {evidence.file_type?.toUpperCase()}
                                    </span>
                                  </div>

                                  <p className="text-xs text-mac-gray-500 mb-2">
                                    {date.toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>

                                  {evidence.description && (
                                    <p className="text-xs text-mac-gray-700 mb-3 p-2 bg-white rounded-lg border-l-2 border-mac-blue-500">
                                      {evidence.description}
                                    </p>
                                  )}

                                  <div className="flex gap-2">
                                    <a
                                      href={evidence.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-lg bg-mac-blue-500 text-white hover:bg-mac-blue-600 transition text-xs font-medium flex items-center gap-1.5"
                                    >
                                      <Eye size={12} />
                                      Ver
                                    </a>
                                    <a
                                      href={evidence.file_url}
                                      download
                                      className="px-3 py-1.5 rounded-lg bg-white border border-mac-gray-200 text-mac-gray-700 hover:bg-mac-gray-50 transition text-xs font-medium flex items-center gap-1.5"
                                    >
                                      <Download size={12} />
                                      Descargar
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 border-2 border-mac-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-sm text-mac-gray-500">Cargando evidencias...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
