import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function CreateMilestoneModal({ isOpen, onClose, projectId, onSuccess }: CreateMilestoneModalProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subcontractorName: '',
    progressPercentage: '0',
    orderIndex: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadNextOrderIndex();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (formData.subcontractorName && formData.subcontractorName.length > 0) {
      const filtered = suppliers.filter(s =>
        s.toLowerCase().includes(formData.subcontractorName.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [formData.subcontractorName, suppliers]);

  async function loadSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSuppliers(data?.map(s => s.name) || []);
      setFilteredSuppliers(data?.map(s => s.name) || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }

  async function loadNextOrderIndex() {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('order_index')
        .eq('project_id', projectId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const nextIndex = data ? data.order_index + 1 : 1;
      setFormData((prev) => ({ ...prev, orderIndex: nextIndex.toString() }));
    } catch (error) {
      console.error('Error loading order index:', error);
      setFormData((prev) => ({ ...prev, orderIndex: '1' }));
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor ingrese el nombre del hito');
      return;
    }

    const progress = parseInt(formData.progressPercentage);
    if (progress < 0 || progress > 100) {
      alert('El porcentaje debe estar entre 0 y 100');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: projectId,
          name: formData.name,
          subcontractor_name: formData.subcontractorName || null,
          progress_percentage: progress,
          order_index: parseInt(formData.orderIndex),
        });

      if (error) throw error;

      setFormData({
        name: '',
        subcontractorName: '',
        progressPercentage: '0',
        orderIndex: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Error al crear el hito. Por favor intente de nuevo.');
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden m-4">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Nuevo Hito de Obra</h3>
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
              Nombre del Hito *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Instalación de Sistema Eléctrico"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcontratista / Proveedor
            </label>
            <input
              type="text"
              name="subcontractorName"
              value={formData.subcontractorName}
              onChange={(e) => {
                handleChange(e);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Escribe para buscar o ingresar nuevo..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
            {showSuggestions && filteredSuppliers.length > 0 && formData.subcontractorName && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.map((supplier, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, subcontractorName: supplier }));
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {supplier}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progreso Inicial (%)
            </label>
            <input
              type="number"
              name="progressPercentage"
              value={formData.progressPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
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
              {loading ? 'Creando...' : 'Crear Hito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
