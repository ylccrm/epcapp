import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserProfile;
  crews: Crew[];
}

export function EditUserModal({ isOpen, onClose, onSuccess, user, crews }: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    assigned_crew_id: user.assigned_crew_id || '',
    is_active: user.is_active,
    change_password: false,
    new_password: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        assigned_crew_id: user.assigned_crew_id || '',
        is_active: user.is_active,
        change_password: false,
        new_password: '',
      });
    }
  }, [isOpen, user]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, new_password: password, change_password: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone || null,
          assigned_crew_id: formData.assigned_crew_id || null,
          is_active: formData.is_active,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (formData.change_password && formData.new_password) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            throw new Error('No hay sesión activa');
          }

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-password`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                newPassword: formData.new_password,
              }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Error al actualizar contraseña');
          }
        } catch (err: any) {
          console.error('Password update error:', err);
          throw new Error(`No se pudo actualizar la contraseña: ${err.message}`);
        }
      }

      await supabase.rpc('create_audit_log', {
        p_user_id: currentUser?.id,
        p_user_email: currentUser?.email || '',
        p_action_type: 'update',
        p_entity_type: 'user',
        p_entity_id: user.id,
        p_description: `Actualizó usuario: ${formData.full_name}`,
      });

      alert(
        formData.change_password
          ? `Usuario actualizado. Nueva contraseña: ${formData.new_password}`
          : 'Usuario actualizado exitosamente'
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(`Error al actualizar usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Editar Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="juan@ejemplo.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Nota: Cambiar el email puede requerir que el usuario verifique su nueva dirección
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="+57 300 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="regular">Regular</option>
                <option value="installer">Instalador</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignar a Cuadrilla
              </label>
              <select
                value={formData.assigned_crew_id}
                onChange={(e) => setFormData({ ...formData, assigned_crew_id: e.target.value })}
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

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Usuario Activo</span>
              </label>
            </div>

            <div className="col-span-2 border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.change_password}
                  onChange={(e) =>
                    setFormData({ ...formData, change_password: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Cambiar Contraseña
                </span>
              </label>

              {formData.change_password && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.new_password}
                      onChange={(e) =>
                        setFormData({ ...formData, new_password: e.target.value })
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Nueva contraseña (mínimo 6 caracteres)"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      title="Generar contraseña automática"
                    >
                      <RefreshCw size={18} />
                      Generar
                    </button>
                  </div>
                  {formData.new_password && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        Contraseña generada: {formData.new_password}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Asegúrate de copiar esta contraseña y compartirla de forma segura con
                        el usuario
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
