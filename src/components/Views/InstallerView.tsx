import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Upload, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  location: string | null;
}

interface Milestone {
  id: string;
  name: string;
  progress_percentage: number;
  project_id: string;
  order_index: number;
}

export function InstallerView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  useEffect(() => {
    loadAssignedProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectMilestones(selectedProject);
    }
  }, [selectedProject]);

  async function loadAssignedProjects() {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('assigned_crew_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData?.assigned_crew_id) {
        setLoading(false);
        return;
      }

      const { data: crewData, error: crewError } = await supabase
        .from('project_crews')
        .select('project_id')
        .eq('id', profileData.assigned_crew_id)
        .maybeSingle();

      if (crewError) throw crewError;

      if (!crewData?.project_id) {
        setLoading(false);
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, client, status, location')
        .eq('id', crewData.project_id);

      if (projectError) throw projectError;

      setProjects(projectData || []);

      if (projectData && projectData.length > 0) {
        setSelectedProject(projectData[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectMilestones(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  }

  async function updateMilestoneProgress(milestoneId: string, newProgress: number) {
    try {
      const milestone = milestones.find((m) => m.id === milestoneId);
      if (!milestone) return;

      const { error } = await supabase
        .from('project_milestones')
        .update({ progress_percentage: newProgress })
        .eq('id', milestoneId);

      if (error) throw error;

      const auditLogId = await supabase.rpc('create_audit_log', {
        p_user_id: user?.id,
        p_user_email: user?.email || '',
        p_action_type: 'update',
        p_entity_type: 'milestone',
        p_entity_id: milestoneId,
        p_description: `Actualizó progreso de "${milestone.name}" a ${newProgress}%`,
        p_metadata: { old_progress: milestone.progress_percentage, new_progress: newProgress },
      });

      await supabase.from('notifications').insert([
        {
          title: 'Actualización de Progreso',
          message: `${user?.email} actualizó "${milestone.name}" a ${newProgress}%`,
          type: 'info',
          category: 'milestone',
          related_project_id: selectedProject,
          is_read: false,
        },
      ]);

      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, progress_percentage: newProgress } : m))
      );
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Error al actualizar el progreso');
    }
  }

  async function uploadEvidence(milestoneId: string, file: File, description: string) {
    try {
      setUploadingEvidence(true);

      const milestone = milestones.find((m) => m.id === milestoneId);

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProject}/${milestoneId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('milestone_evidence').insert([
        {
          milestone_id: milestoneId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          description: description || null,
          uploaded_by: user?.email || 'installer',
        },
      ]);

      if (dbError) throw dbError;

      await supabase.rpc('create_audit_log', {
        p_user_id: user?.id,
        p_user_email: user?.email || '',
        p_action_type: 'upload',
        p_entity_type: 'milestone_evidence',
        p_entity_id: milestoneId,
        p_description: `Subió evidencia fotográfica: ${file.name}`,
        p_metadata: { file_type: file.type, file_size: file.size, description },
      });

      await supabase.from('notifications').insert([
        {
          title: 'Nueva Evidencia Fotográfica',
          message: `${user?.email} subió foto de "${milestone?.name || 'hito'}"${description ? ': ' + description : ''}`,
          type: 'success',
          category: 'milestone',
          related_project_id: selectedProject,
          is_read: false,
        },
      ]);

      alert('Evidencia subida exitosamente');
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert('Error al subir la evidencia');
    } finally {
      setUploadingEvidence(false);
    }
  }

  const handleFileUpload = (milestoneId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const description = prompt('Descripción de la foto (opcional):');
        await uploadEvidence(milestoneId, file, description || '');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700">Cargando...</div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No hay proyectos asignados
          </h2>
          <p className="text-gray-600">
            Contacte a su supervisor para ser asignado a un proyecto
          </p>
        </div>
      </div>
    );
  }

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Vista de Instalador</h1>
        {currentProject && (
          <div className="text-sm opacity-90">
            <div className="font-medium">{currentProject.name}</div>
            <div className="text-xs">{currentProject.client}</div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{milestone.name}</h3>
                  <div className="text-sm text-gray-600">
                    Progreso: {milestone.progress_percentage}%
                  </div>
                </div>
                {milestone.progress_percentage === 100 && (
                  <CheckCircle2 className="text-green-500 flex-shrink-0" size={24} />
                )}
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${milestone.progress_percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateMilestoneProgress(milestone.id, 25)}
                  disabled={milestone.progress_percentage >= 25}
                  className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  25%
                </button>
                <button
                  onClick={() => updateMilestoneProgress(milestone.id, 50)}
                  disabled={milestone.progress_percentage >= 50}
                  className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  50%
                </button>
                <button
                  onClick={() => updateMilestoneProgress(milestone.id, 75)}
                  disabled={milestone.progress_percentage >= 75}
                  className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  75%
                </button>
              </div>

              <button
                onClick={() => updateMilestoneProgress(milestone.id, 100)}
                disabled={milestone.progress_percentage === 100}
                className="w-full mt-2 px-4 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Marcar como Completado
              </button>

              <button
                onClick={() => handleFileUpload(milestone.id)}
                disabled={uploadingEvidence}
                className="w-full mt-2 px-4 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingEvidence ? (
                  <>
                    <Upload size={18} className="animate-pulse" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    Subir Foto de Evidencia
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {milestones.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay hitos para este proyecto
          </div>
        )}
      </div>
    </div>
  );
}
