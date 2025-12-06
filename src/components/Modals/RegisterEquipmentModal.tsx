import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegisterEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

interface Provider {
  id: string;
  name: string;
}

export function RegisterEquipmentModal({ isOpen, onClose, projectId, onSuccess }: RegisterEquipmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    equipment_name: '',
    equipment_type: 'inverter',
    serial_number: '',
    supplier: '',
    purchase_date: '',
    installation_date: '',
    warranty_years: '10',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

  async function loadProviders() {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.installation_date && formData.installation_date > new Date().toISOString().split('T')[0]) {
      alert('La fecha de instalación no puede ser futura');
      return;
    }

    if (formData.purchase_date && formData.purchase_date > new Date().toISOString().split('T')[0]) {
      alert('La fecha de compra no puede ser futura');
      return;
    }

    const warranty = parseInt(formData.warranty_years);
    if (warranty < 1 || warranty > 30) {
      alert('La garantía debe estar entre 1 y 30 años');
      return;
    }

    setLoading(true);

    try {
      const { data: existingEquipment } = await supabase
        .from('project_equipment')
        .select('serial_number')
        .eq('serial_number', formData.serial_number)
        .maybeSingle();

      if (existingEquipment) {
        alert('Ya existe un equipo registrado con este número de serie');
        setLoading(false);
        return;
      }

      let manualUrl = null;
      let invoiceUrl = null;

      if (manualFile) {
        const manualFileName = `${projectId}/${Date.now()}-manual-${manualFile.name}`;
        const { data: manualData, error: manualError } = await supabase.storage
          .from('equipment-docs')
          .upload(manualFileName, manualFile);

        if (manualError) throw manualError;

        const { data: manualUrlData } = supabase.storage
          .from('equipment-docs')
          .getPublicUrl(manualData.path);

        manualUrl = manualUrlData.publicUrl;
      }

      if (invoiceFile) {
        const invoiceFileName = `${projectId}/${Date.now()}-invoice-${invoiceFile.name}`;
        const { data: invoiceData, error: invoiceError } = await supabase.storage
          .from('equipment-docs')
          .upload(invoiceFileName, invoiceFile);

        if (invoiceError) throw invoiceError;

        const { data: invoiceUrlData } = supabase.storage
          .from('equipment-docs')
          .getPublicUrl(invoiceData.path);

        invoiceUrl = invoiceUrlData.publicUrl;
      }

      const { error } = await supabase
        .from('project_equipment')
        .insert([
          {
            project_id: projectId,
            equipment_name: formData.equipment_name,
            equipment_type: formData.equipment_type,
            serial_number: formData.serial_number,
            supplier: formData.supplier || null,
            purchase_date: formData.purchase_date || null,
            installation_date: formData.installation_date || null,
            warranty_years: parseInt(formData.warranty_years),
            notes: formData.notes || null,
            manual_url: manualUrl,
            invoice_url: invoiceUrl,
          },
        ]);

      if (error) throw error;

      setFormData({
        equipment_name: '',
        equipment_type: 'inverter',
        serial_number: '',
        supplier: '',
        purchase_date: '',
        installation_date: '',
        warranty_years: '10',
        notes: '',
      });
      setManualFile(null);
      setInvoiceFile(null);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error registering equipment:', error);
      alert('Error al registrar el equipo. Por favor intente de nuevo.');
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
          <h3 className="font-bold text-lg text-white">Registrar Equipo</h3>
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
              Nombre del Equipo *
            </label>
            <input
              type="text"
              name="equipment_name"
              value={formData.equipment_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Inversor Principal A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Equipo *
              </label>
              <select
                name="equipment_type"
                value={formData.equipment_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
              >
                <option value="inverter">Inversor</option>
                <option value="panel_batch">Panel Solar</option>
                <option value="meter">Medidor</option>
                <option value="transformer">Transformador</option>
                <option value="battery">Batería</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Serie *
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="SN123456"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
            >
              <option value="">Seleccionar proveedor (opcional)...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.name}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Compra
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Instalación
              </label>
              <input
                type="date"
                name="installation_date"
                value={formData.installation_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Garantía (años) *
            </label>
            <input
              type="number"
              name="warranty_years"
              value={formData.warranty_years}
              onChange={handleChange}
              required
              min="1"
              max="30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Ubicación, observaciones, detalles adicionales"
            />
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Documentos</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual del Equipo
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="manual-file"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <label
                  htmlFor="manual-file"
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {manualFile ? manualFile.name : 'Subir manual (PDF, DOC)'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factura de Compra
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="invoice-file"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <label
                  htmlFor="invoice-file"
                  className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {invoiceFile ? invoiceFile.name : 'Subir factura (PDF, JPG, PNG)'}
                  </span>
                </label>
              </div>
            </div>
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
              {loading ? 'Registrando...' : 'Registrar Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
