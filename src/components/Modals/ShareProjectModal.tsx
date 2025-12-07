import { useState } from 'react';
import { X, Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ShareProjectModal({ isOpen, onClose, projectId, projectName }: ShareProjectModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleShare = async () => {
    if (!email.trim()) {
      showToast('Por favor ingresa un email', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Por favor ingresa un email válido', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_project_invitation', {
        p_project_id: projectId,
        p_email_invited: email.toLowerCase().trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        showToast(result.error || 'Error al enviar la invitación', 'error');
        return;
      }

      showToast('Invitación enviada exitosamente', 'success');
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Error sharing project:', error);
      showToast('Error al compartir el proyecto', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center fade-in px-4">
      <div className="apple-card w-full max-w-md overflow-hidden slide-up">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Compartir Proyecto</h3>
            <p className="text-sm text-gray-500 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email del usuario
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="apple-input pl-11"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              El usuario recibirá una notificación y deberá aceptar la invitación
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Permisos del colaborador:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Puede ver toda la información del proyecto</li>
              <li>• Puede editar y actualizar datos</li>
              <li>• Puede subir documentos y evidencia</li>
              <li>• No puede eliminar el proyecto</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="apple-button-ghost"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleShare}
            className="apple-button-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Enviar Invitación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
