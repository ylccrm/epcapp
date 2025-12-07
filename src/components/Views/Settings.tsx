import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Globe, Plus, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { EditUserModal } from '../Modals/EditUserModal';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  assigned_crew_id: string | null;
  is_active: boolean;
}

interface Crew {
  id: string;
  name: string;
  project_id: string;
}

export function Settings() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'audit'>('general');
  const [language, setLanguage] = useState('es');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'installer',
    phone: '',
    assigned_crew_id: '',
  });

  useEffect(() => {
    loadSettings();
    if (userProfile?.role === 'admin') {
      loadUsers();
      loadCrews();
    }
  }, [userProfile]);

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('setting_key', 'language')
        .maybeSingle();

      if (data) {
        setLanguage(data.setting_value);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function loadCrews() {
    try {
      const { data, error } = await supabase
        .from('project_crews')
        .select('id, name, project_id')
        .order('name');

      if (error) throw error;
      setCrews(data || []);
    } catch (error) {
      console.error('Error loading crews:', error);
    }
  }

  async function updateLanguage(newLanguage: string) {
    try {
      setLanguage(newLanguage);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          user_id: user?.id,
          setting_key: 'language',
          setting_value: newLanguage,
        });

      if (error) throw error;

      await supabase.rpc('create_audit_log', {
        p_user_id: user?.id,
        p_user_email: user?.email || '',
        p_action_type: 'update',
        p_entity_type: 'settings',
        p_entity_id: user?.id,
        p_description: `Cambió el idioma a ${newLanguage}`,
      });
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }

  async function createInstallerAccount() {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: newUser.role,
            phone: newUser.phone || null,
            assigned_crew_id: newUser.assigned_crew_id || null,
            full_name: newUser.full_name,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }

        await supabase.rpc('create_audit_log', {
          p_user_id: user?.id,
          p_user_email: user?.email || '',
          p_action_type: 'create',
          p_entity_type: 'user',
          p_entity_id: authData.user.id,
          p_description: `Creó cuenta de ${newUser.role}: ${newUser.full_name}`,
        });

        setNewUser({
          email: '',
          password: '',
          full_name: '',
          role: 'installer',
          phone: '',
          assigned_crew_id: '',
        });

        setShowNewUserForm(false);
        await loadUsers();
        alert('Usuario creado exitosamente. El perfil se creará automáticamente.');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(`Error al crear usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('create_audit_log', {
        p_user_id: user?.id,
        p_user_email: user?.email || '',
        p_action_type: 'update',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_description: `${currentStatus ? 'Desactivó' : 'Activó'} cuenta de usuario`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  }

  function handleEditUser(user: UserProfile) {
    setSelectedUser(user);
    setShowEditUserModal(true);
  }

  function handleEditUserSuccess() {
    loadUsers();
    setShowEditUserModal(false);
    setSelectedUser(null);
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      installer: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-green-100 text-green-800',
    };
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      installer: 'Instalador',
      supervisor: 'Supervisor',
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="text-slate-800" size={32} />
        <h1 className="text-3xl font-bold text-slate-800">Configuración</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition ${
              activeTab === 'general'
                ? 'bg-slate-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe size={18} className="inline mr-2" />
            General
          </button>
          {userProfile?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition ${
                activeTab === 'users'
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={18} className="inline mr-2" />
              Gestión de Usuarios
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Preferencias de Idioma</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="language"
                      value="es"
                      checked={language === 'es'}
                      onChange={(e) => updateLanguage(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium text-gray-800">Español</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={language === 'en'}
                      onChange={(e) => updateLanguage(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium text-gray-800">English</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Información de Cuenta</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p>
                    <span className="font-medium">Rol:</span>{' '}
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getRoleBadge(userProfile?.role || '')}`}>
                      {getRoleLabel(userProfile?.role || '')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && userProfile?.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Usuarios del Sistema</h3>
                <button
                  onClick={() => setShowNewUserForm(!showNewUserForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <Plus size={18} />
                  Nuevo Usuario
                </button>
              </div>

              {showNewUserForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                  <h4 className="font-bold text-gray-800">Crear Cuenta de Usuario</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="regular">Regular</option>
                        <option value="installer">Instalador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asignar a Cuadrilla
                      </label>
                      <select
                        value={newUser.assigned_crew_id}
                        onChange={(e) =>
                          setNewUser({ ...newUser, assigned_crew_id: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Sin asignar</option>
                        {crews.map((crew) => (
                          <option key={crew.id} value={crew.id}>
                            {crew.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowNewUserForm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={createInstallerAccount}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Usuario'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-gray-800">{u.full_name}</h4>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${getRoleBadge(u.role)}`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                        {!u.is_active && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{u.email}</p>
                      {u.phone && (
                        <p className="text-xs text-gray-500 mt-0.5">{u.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar usuario"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(u.id, u.is_active)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title={u.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {u.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <EditUserModal
          isOpen={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditUserSuccess}
          user={selectedUser}
          crews={crews}
        />
      )}
    </div>
  );
}
