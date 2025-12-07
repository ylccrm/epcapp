import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Trash2, Shield, Edit3, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type ProjectCollaborator = Database['public']['Tables']['project_collaborators']['Row'] & {
  user_profile?: UserProfile;
};

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ShareProjectModal({ isOpen, onClose, projectId, projectName }: ShareProjectModalProps) {
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
      loadAvailableUsers();
    }
  }, [isOpen, projectId]);

  async function loadCollaborators() {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCollaborators((data as any) || []);

      // Determine current user's role in this project
      const currentUserCollab = (data as any)?.find((c: any) => c.user_id === userProfile?.id);
      setUserRole(currentUserCollab?.role || (userProfile?.role === 'admin' ? 'admin' : null));
    } catch (error) {
      console.error('Error loading collaborators:', error);
      showToast('Error al cargar colaboradores', 'error');
    }
  }

  async function loadAvailableUsers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;

      const filtered = (data || []).filter(
        (user) => !collaborators.some((c) => c.user_id === user.id)
      );

      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function handleAddCollaborator() {
    if (!selectedUser) {
      showToast('Por favor selecciona un usuario', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: selectedUser,
          role: selectedRole,
          added_by: userProfile?.id,
        });

      if (error) throw error;

      showToast('Colaborador agregado exitosamente', 'success');
      setShowAddForm(false);
      setSelectedUser('');
      setSelectedRole('viewer');
      await loadCollaborators();
      await loadAvailableUsers();
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      showToast('Error al agregar colaborador', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveCollaborator(collaboratorId: string, collaboratorRole: string) {
    if (collaboratorRole === 'owner') {
      showToast('No puedes remover al dueño del proyecto', 'error');
      return;
    }

    if (!confirm('¿Estás seguro de remover a este colaborador?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      showToast('Colaborador removido exitosamente', 'success');
      await loadCollaborators();
      await loadAvailableUsers();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      showToast('Error al remover colaborador', 'error');
    } finally {
      setLoading(false);
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner':
        return <Shield size={16} className="text-yellow-600" />;
      case 'editor':
        return <Edit3 size={16} className="text-blue-600" />;
      case 'viewer':
        return <Eye size={16} className="text-green-600" />;
      default:
        return <Eye size={16} className="text-gray-600" />;
    }
  }

  function getRoleLabel(role: string) {
    const labels = {
      owner: 'Propietario',
      editor: 'Editor',
      viewer: 'Visualizador',
    };
    return labels[role as keyof typeof labels] || role;
  }

  function getRoleBadge(role: string) {
    const badges = {
      owner: 'bg-yellow-100 text-yellow-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-green-100 text-green-800',
    };
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  }

  const filteredUsers = availableUsers.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white">Compartir Proyecto</h3>
            <p className="text-sm text-slate-300">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {userRole && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Tu rol en este proyecto:</strong>{' '}
                {userRole === 'owner' && 'Propietario (control total)'}
                {userRole === 'editor' && 'Editor (puedes modificar)'}
                {userRole === 'viewer' && 'Visualizador (solo lectura)'}
                {userRole === 'admin' && 'Super Administrador (control total)'}
              </p>
            </div>
          )}

          {!userRole && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Aviso:</strong> No tienes permisos para modificar este proyecto. Solo puedes ver los colaboradores actuales.
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Colaboradores Actuales</h4>
              {(userRole === 'owner' || userRole === 'admin') && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus size={16} />
                  Agregar Colaborador
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar usuarios..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
                  >
                    <option value="">Seleccionar usuario</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-3">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'viewer' | 'editor')}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
                    >
                      <option value="viewer">Visualizador (solo lectura)</option>
                      <option value="editor">Editor (puede editar)</option>
                    </select>

                    <button
                      onClick={handleAddCollaborator}
                      disabled={loading || !selectedUser}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {collaborators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield size={48} className="mx-auto text-gray-300 mb-2" />
                  <p>No hay colaboradores en este proyecto</p>
                </div>
              ) : (
                collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(collaborator.user_profile as any)?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {(collaborator.user_profile as any)?.full_name || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(collaborator.user_profile as any)?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(collaborator.role)}`}>
                        {getRoleIcon(collaborator.role)}
                        {getRoleLabel(collaborator.role)}
                      </span>

                      {collaborator.role !== 'owner' && (userRole === 'owner' || userRole === 'admin') && (
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.role)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 transition disabled:opacity-50"
                          title="Remover colaborador"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-900 mb-2 text-sm">Información sobre Roles</h5>
            <ul className="space-y-1 text-xs text-blue-800">
              <li className="flex items-start gap-2">
                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong>Propietario:</strong> Control total del proyecto (no se puede remover)</span>
              </li>
              <li className="flex items-start gap-2">
                <Edit3 size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong>Editor:</strong> Puede ver y modificar el proyecto</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye size={14} className="mt-0.5 flex-shrink-0" />
                <span><strong>Visualizador:</strong> Solo puede ver el proyecto (sin editar)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
