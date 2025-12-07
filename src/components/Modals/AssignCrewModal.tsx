import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AssignCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function AssignCrewModal({ isOpen, onClose, projectId, onSuccess }: AssignCrewModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    crew_name: '',
    leader_name: '',
    members: '',
    specialty: 'Instalación Eléctrica',
    contact_phone: '',
    status: 'active',
    current_task: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const membersArray = formData.members
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      const { error } = await supabase
        .from('project_crews')
        .insert([
          {
            project_id: projectId,
            crew_name: formData.crew_name,
            leader_name: formData.leader_name,
            members: membersArray,
            specialty: formData.specialty,
            contact_phone: formData.contact_phone || null,
            status: formData.status,
            current_task: formData.current_task || null,
          },
        ]);

      if (error) throw error;

      setFormData({
        crew_name: '',
        leader_name: '',
        members: '',
        specialty: 'Instalación Eléctrica',
        contact_phone: '',
        status: 'active',
        current_task: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning crew:', error);
      alert('Error al asignar la cuadrilla. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden m-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Asignar Cuadrilla</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Cuadrilla *
            </label>
            <input
              type="text"
              name="crew_name"
              value={formData.crew_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Cuadrilla Alpha"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Líder de Cuadrilla *
              </label>
              <input
                type="text"
                name="leader_name"
                value={formData.leader_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="Nombre del líder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miembros (separados por comas)
            </label>
            <input
              type="text"
              name="members"
              value={formData.members}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Juan Pérez, María García, Carlos López"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingrese los nombres separados por comas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
              >
                <option>Instalación Eléctrica</option>
                <option>Obra Civil</option>
                <option>Montaje Mecánico</option>
                <option>Estructura</option>
                <option>HSE / Seguridad</option>
                <option>General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
              >
                <option value="active">Activo</option>
                <option value="on_break">De Descanso</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarea Actual
            </label>
            <textarea
              name="current_task"
              value={formData.current_task}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Instalación de estructura en Sector A"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Asignando...' : 'Asignar Cuadrilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
