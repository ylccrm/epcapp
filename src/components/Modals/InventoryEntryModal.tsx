import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InventoryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InventoryItem {
  id: string;
  product_name: string;
  category: string;
}

interface Provider {
  id: string;
  name: string;
}

export function InventoryEntryModal({ isOpen, onClose, onSuccess }: InventoryEntryModalProps) {
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    quantity: '',
    provider_name: '',
    reference_number: '',
    reception_date: new Date().toISOString().split('T')[0],
    batch_number: '',
    quality_notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadInventoryItems();
      loadProviders();
    }
  }, [isOpen]);

  async function loadInventoryItems() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, product_name, category')
        .order('product_name');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.inventory_item_id) {
      alert('Por favor seleccione un producto');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (formData.reception_date > new Date().toISOString().split('T')[0]) {
      alert('La fecha de recepción no puede ser futura');
      return;
    }

    setLoading(true);

    try {
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', formData.inventory_item_id)
        .single();

      if (fetchError) throw fetchError;

      const newStock = (currentItem.current_stock || 0) + quantity;

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', formData.inventory_item_id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert([
          {
            inventory_item_id: formData.inventory_item_id,
            transaction_type: 'entry',
            quantity: quantity,
            reference_number: formData.reference_number || null,
            provider_name: formData.provider_name || null,
            notes: `Lote: ${formData.batch_number || 'N/A'}\nNotas de calidad: ${formData.quality_notes || 'N/A'}`,
            created_by: 'user',
          },
        ]);

      if (transactionError) throw transactionError;

      setFormData({
        inventory_item_id: '',
        quantity: '',
        provider_name: '',
        reference_number: '',
        reception_date: new Date().toISOString().split('T')[0],
        batch_number: '',
        quality_notes: '',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating inventory entry:', error);
      alert('Error al registrar la entrada. Por favor intente de nuevo.');
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
          <h3 className="font-bold text-lg text-white">Entrada de Inventario</h3>
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
              Producto *
            </label>
            <select
              name="inventory_item_id"
              value={formData.inventory_item_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
            >
              <option value="">Seleccionar producto...</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.product_name} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Recibida *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Recepción *
              </label>
              <input
                type="date"
                name="reception_date"
                value={formData.reception_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <select
              name="provider_name"
              value={formData.provider_name}
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
                No. de Orden de Compra
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="PO-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lote/Batch
              </label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas de Calidad
            </label>
            <textarea
              name="quality_notes"
              value={formData.quality_notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Estado del producto, daños, observaciones..."
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
              className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
