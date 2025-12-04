import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

interface Provider {
  id: string;
  name: string;
}

export function NewPurchaseOrderModal({ isOpen, onClose, projectId, onSuccess }: NewPurchaseOrderModalProps) {
  const { currency, exchangeRate } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    providerName: '',
    itemsDescription: '',
    totalAmount: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    paymentTerms: '30 días',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no puede superar los 5MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.providerName) {
      alert('Por favor seleccione un proveedor');
      return;
    }

    if (formData.expectedDeliveryDate && formData.expectedDeliveryDate < formData.orderDate) {
      alert('La fecha de entrega debe ser posterior a la fecha de orden');
      return;
    }

    setLoading(true);

    try {
      let totalInUSD = parseFloat(formData.totalAmount);
      if (currency === 'COP') {
        totalInUSD = totalInUSD / exchangeRate;
      }

      let pdfUrl = null;

      if (pdfFile) {
        const fileExt = 'pdf';
        const fileName = `${projectId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('purchase-order-pdfs')
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('purchase-order-pdfs')
          .getPublicUrl(filePath);

        pdfUrl = urlData.publicUrl;
      }

      const orderNumber = `PO-${Date.now().toString().slice(-6)}`;

      const { error } = await supabase
        .from('purchase_orders')
        .insert([
          {
            project_id: projectId,
            order_number: orderNumber,
            provider_name: formData.providerName,
            items_description: formData.itemsDescription,
            total_usd: totalInUSD,
            order_date: formData.orderDate,
            expected_delivery_date: formData.expectedDeliveryDate || null,
            payment_terms: formData.paymentTerms,
            notes: formData.notes,
            status: 'pending',
            pdf_url: pdfUrl,
          },
        ]);

      if (error) throw error;

      setFormData({
        providerName: '',
        itemsDescription: '',
        totalAmount: '',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        paymentTerms: '30 días',
        notes: '',
      });
      setPdfFile(null);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Error al crear la orden de compra. Por favor intente de nuevo.');
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden m-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg text-white">Nueva Orden de Compra</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor *
                </label>
                <select
                  name="providerName"
                  value={formData.providerName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.name}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos de Pago
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
                >
                  <option>15 días</option>
                  <option>30 días</option>
                  <option>45 días</option>
                  <option>60 días</option>
                  <option>90 días</option>
                  <option>Contra entrega</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de Items *
              </label>
              <textarea
                name="itemsDescription"
                value={formData.itemsDescription}
                onChange={handleChange}
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="Ej: 100 Paneles Solares 450W, 10 Inversores 5kW..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-xs font-bold mt-0.5">
                    {currency}
                  </span>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Orden *
                </label>
                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entrega Esperada
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Internas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo PDF (Opcional, máx 5MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  {pdfFile ? (
                    <p className="text-sm text-gray-700 font-medium">{pdfFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Haga clic para cargar un archivo PDF
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, máximo 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
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
              {loading ? 'Creando...' : 'Crear Orden de Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
