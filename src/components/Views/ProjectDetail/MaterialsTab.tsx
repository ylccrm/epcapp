import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProjectCurrency } from '../../../hooks/useProjectCurrency';
import { NewPurchaseOrderModal } from '../../Modals/NewPurchaseOrderModal';
import type { Database } from '../../../lib/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];

interface MaterialsTabProps {
  projectId: string;
}

export function MaterialsTab({ projectId }: MaterialsTabProps) {
  const { formatAmount } = useProjectCurrency(projectId);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [projectId]);

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'received') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'received' ? 'Recibido' : 'Pendiente';
  };

  async function handleMarkAsReceived(orderId: string) {
    if (!confirm('¿Marcar esta orden como recibida y crear equipo?')) {
      return;
    }

    try {
      const receivedDate = new Date().toISOString().split('T')[0];

      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Orden no encontrada');
      }

      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update({
          status: 'received',
          received: true,
          received_date: receivedDate,
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      const { error: equipmentError } = await supabase
        .from('project_equipment')
        .insert({
          project_id: projectId,
          equipment_name: order.items_description || 'Equipo sin nombre',
          equipment_type: 'other',
          supplier: order.provider_name,
          purchase_date: order.order_date || receivedDate,
          status: 'new',
          purchase_order_id: orderId,
          quantity: 1,
          notes: order.notes || null,
        });

      if (equipmentError) throw equipmentError;

      await loadOrders();
      alert('Orden marcada como recibida y equipo creado exitosamente');
    } catch (error) {
      console.error('Error marking order as received:', error);
      alert('Error al procesar la orden. Por favor intente de nuevo.');
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-slate-700">Órdenes de Compra (PO)</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white border border-gray-300 text-xs px-3 py-1 rounded shadow-sm hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus size={14} />
            Nueva Orden
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando órdenes...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay órdenes de compra registradas para este proyecto
          </div>
        ) : (
          <div className="p-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="pb-2">No. Orden</th>
                  <th className="pb-2">Proveedor</th>
                  <th className="pb-2">Fecha Orden</th>
                  <th className="pb-2">Entrega Esperada</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-gray-600 font-mono text-xs">
                      {order.order_number || '-'}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-800">{order.provider_name}</div>
                      {order.payment_terms && (
                        <div className="text-xs text-gray-500">{order.payment_terms}</div>
                      )}
                    </td>
                    <td className="py-3 text-gray-600">
                      {order.order_date ? new Date(order.order_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="py-3 text-gray-600">
                      {order.items_description || 'Sin descripción'}
                      {order.notes && (
                        <div className="text-xs text-gray-400 mt-0.5">{order.notes}</div>
                      )}
                    </td>
                    <td className="py-3 text-right font-bold">
                      {formatAmount(Number(order.total_usd))}
                    </td>
                    <td className="py-3 text-center">
                      {order.status === 'received' ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          {order.received_date && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {new Date(order.received_date).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsReceived(order.id)}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-green-100 hover:text-green-800 transition"
                        >
                          Marcar Recibido
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewPurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSuccess={loadOrders}
      />
    </div>
  );
}
