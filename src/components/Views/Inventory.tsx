import { useEffect, useState } from 'react';
import { Sun, Zap, Plug, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import { InventoryEntryModal } from '../Modals/InventoryEntryModal';
import type { Database } from '../../lib/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

export function Inventory() {
  const { formatAmount } = useCurrency();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'panels', label: 'Paneles', icon: Sun },
    { id: 'inverters', label: 'Inversores', icon: Zap },
    { id: 'electrical', label: 'Eléctrico', icon: Plug },
  ];

  const getCategoryCount = (categoryId: string) => {
    return items.filter((item) => item.category === categoryId).length;
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Agotado', className: 'bg-red-100 text-red-800 animate-pulse' };
    if (quantity < 10) return { label: 'Bajo Stock', className: 'bg-red-100 text-red-800 animate-pulse' };
    if (quantity < 50) return { label: 'Stock Medio', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'OK', className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-bold text-slate-700 mb-4">Categorías</h3>
          <ul className="space-y-2 text-sm">
            <li
              onClick={() => setSelectedCategory(null)}
              className={`flex justify-between items-center p-2 rounded cursor-pointer font-medium transition ${
                selectedCategory === null
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span>Todas</span>
              <span className={`px-2 rounded-full text-xs ${
                selectedCategory === null ? 'bg-white' : 'bg-gray-100'
              }`}>
                {items.length}
              </span>
            </li>
            {categories.map((category) => {
              const Icon = category.icon;
              const count = getCategoryCount(category.id);
              const isSelected = selectedCategory === category.id;
              return (
                <li
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={16} />
                    {category.label}
                  </span>
                  <span className={`px-2 rounded-full text-xs ${
                    isSelected ? 'bg-white' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Stock en Bodega Principal</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 flex items-center gap-1"
            >
              <Plus size={14} />
              Entrada
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando inventario...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay items en esta categoría</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3 text-center">Disponible</th>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3 text-right">Valor Unit.</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item.stock_quantity);
                    const isLowStock = item.stock_quantity <= (item.min_stock || 10);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.sku} | {item.unit || 'pza'}
                            {item.description && (
                              <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.supplier || '-'}
                        </td>
                        <td className={`px-6 py-4 text-center ${
                          isLowStock ? 'text-red-600' : ''
                        }`}>
                          <div className="font-bold text-lg">{item.stock_quantity}</div>
                          {isLowStock && (
                            <div className="text-xs text-gray-500">Min: {item.min_stock}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {item.warehouse_location || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatAmount(Number(item.unit_cost_usd))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <InventoryEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadInventory}
      />
    </div>
  );
}
