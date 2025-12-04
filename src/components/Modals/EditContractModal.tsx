import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { Database } from '../../lib/database.types';

type Contract = Database['public']['Tables']['contracts']['Row'];
type PaymentMilestone = Database['public']['Tables']['contract_payment_milestones']['Row'];

interface EditablePaymentMilestone {
  id?: string;
  milestone_name: string;
  percentage: number;
  amount_usd: number;
  status: 'pending' | 'paid';
  order_index: number;
  paid_date?: string | null;
  isNew?: boolean;
}

interface EditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  milestones: PaymentMilestone[];
  onSuccess: () => void;
}

export function EditContractModal({ isOpen, onClose, contract, milestones, onSuccess }: EditContractModalProps) {
  const { currency, exchangeRate } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [subcontractor, setSubcontractor] = useState(contract.subcontractor_name);
  const [serviceType, setServiceType] = useState(contract.service_type);
  const [totalValue, setTotalValue] = useState(String(Number(contract.total_value_usd)));
  const [editableMilestones, setEditableMilestones] = useState<EditablePaymentMilestone[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSubcontractor(contract.subcontractor_name);
      setServiceType(contract.service_type);
      setTotalValue(String(Number(contract.total_value_usd)));
      setEditableMilestones(
        milestones.map((m) => ({
          id: m.id,
          milestone_name: m.milestone_name,
          percentage: Number(m.percentage),
          amount_usd: Number(m.amount_usd),
          status: m.status,
          order_index: m.order_index,
          paid_date: m.paid_date,
          isNew: false,
        }))
      );
    }
  }, [isOpen, contract, milestones]);

  useEffect(() => {
    if (totalValue) {
      calculateMilestoneAmounts(parseFloat(totalValue));
    }
  }, [totalValue, currency]);

  const calculateMilestoneAmounts = (total: number) => {
    let totalInUSD = total;
    if (currency === 'COP') {
      totalInUSD = total / exchangeRate;
    }

    setEditableMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount_usd: (totalInUSD * m.percentage) / 100,
      }))
    );
  };

  const handleMilestoneChange = (index: number, field: keyof EditablePaymentMilestone, value: any) => {
    setEditableMilestones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === 'percentage' && totalValue) {
      calculateMilestoneAmounts(parseFloat(totalValue));
    }
  };

  const addMilestone = () => {
    setEditableMilestones((prev) => [
      ...prev,
      {
        milestone_name: 'Nuevo Hito',
        percentage: 0,
        amount_usd: 0,
        status: 'pending',
        order_index: prev.length + 1,
        isNew: true,
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    const milestone = editableMilestones[index];

    if (milestone.status === 'paid') {
      alert('No se puede eliminar un hito que ya ha sido pagado');
      return;
    }

    if (editableMilestones.length <= 1) {
      alert('Debe haber al menos un hito de pago');
      return;
    }

    setEditableMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const getTotalPercentage = () => {
    return editableMilestones.reduce((sum, m) => sum + m.percentage, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subcontractor || subcontractor === 'Seleccionar...') {
      alert('Por favor seleccione un subcontratista');
      return;
    }

    const totalPct = getTotalPercentage();
    if (totalPct !== 100) {
      alert(`El total de porcentajes debe ser 100%. Actualmente es ${totalPct}%`);
      return;
    }

    setLoading(true);

    try {
      let totalInUSD = parseFloat(totalValue);
      if (currency === 'COP') {
        totalInUSD = totalInUSD / exchangeRate;
      }

      const paidMilestones = editableMilestones.filter((m) => m.status === 'paid');
      const paidAmount = paidMilestones.reduce((sum, m) => sum + m.amount_usd, 0);

      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          subcontractor_name: subcontractor,
          service_type: serviceType,
          total_value_usd: totalInUSD,
          paid_amount_usd: paidAmount,
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      const existingMilestoneIds = editableMilestones
        .filter((m) => m.id && !m.isNew)
        .map((m) => m.id as string);

      const milestonesToDelete = milestones
        .filter((m) => !existingMilestoneIds.includes(m.id))
        .map((m) => m.id);

      if (milestonesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('contract_payment_milestones')
          .delete()
          .in('id', milestonesToDelete);

        if (deleteError) throw deleteError;
      }

      for (const [index, milestone] of editableMilestones.entries()) {
        if (milestone.isNew || !milestone.id) {
          const { error: insertError } = await supabase
            .from('contract_payment_milestones')
            .insert({
              contract_id: contract.id,
              milestone_name: milestone.milestone_name,
              percentage: milestone.percentage,
              amount_usd: milestone.amount_usd,
              status: milestone.status,
              order_index: index + 1,
            });

          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase
            .from('contract_payment_milestones')
            .update({
              milestone_name: milestone.milestone_name,
              percentage: milestone.percentage,
              amount_usd: milestone.amount_usd,
              order_index: index + 1,
            })
            .eq('id', milestone.id);

          if (updateError) throw updateError;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Error al actualizar el contrato. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    const displayAmount = currency === 'COP' ? amount * exchangeRate : amount;
    return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(displayAmount);
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
          <h3 className="font-bold text-lg text-white flex items-center">
            <i className="fas fa-edit text-yellow-500 mr-2"></i>
            Editar Subcontrato
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Subcontratista / Proveedor
                </label>
                <select
                  value={subcontractor}
                  onChange={(e) => setSubcontractor(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  <option>Montajes Eléctricos del Norte</option>
                  <option>Seguridad Alturas Ltda</option>
                  <option>Ingeniería & Diseños S.A.S</option>
                  <option>Logística Rápida</option>
                  <option>Estructuras Metálicas</option>
                  <option>Cable & Energía S.A.S</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Tipo de Servicio
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                >
                  <option>Instalación Eléctrica</option>
                  <option>Obra Civil</option>
                  <option>Montaje Mecánico</option>
                  <option>Ingeniería</option>
                  <option>HSE / Seguridad</option>
                  <option>Suministro de Materiales</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Valor Total del Contrato
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-bold text-sm">
                  {currency}
                </span>
                <input
                  type="number"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-2 text-lg font-semibold text-slate-800 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-sm text-slate-700">Cronograma de Pagos (Hitos)</h4>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Agregar Hito
                </button>
              </div>

              <div className="space-y-3">
                {editableMilestones.map((milestone, index) => (
                  <div
                    key={milestone.id || index}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={milestone.milestone_name}
                        onChange={(e) => handleMilestoneChange(index, 'milestone_name', e.target.value)}
                        disabled={milestone.status === 'paid'}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="Nombre del hito"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={milestone.percentage}
                        onChange={(e) => handleMilestoneChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                        disabled={milestone.status === 'paid'}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="col-span-3 text-right text-sm font-medium text-slate-700">
                      {formatAmount(milestone.amount_usd)}
                    </div>
                    <div className="col-span-2 text-right">
                      {milestone.status === 'paid' ? (
                        <span className="text-xs text-green-600 font-semibold">Pagado</span>
                      ) : editableMilestones.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 text-xs font-bold text-right text-gray-500">Total:</div>
                <div
                  className={`col-span-2 text-xs font-bold text-center ${
                    getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {getTotalPercentage()}%
                </div>
                <div className="col-span-3 text-right text-xs font-bold text-gray-800">
                  {totalValue ? formatAmount(parseFloat(totalValue) / (currency === 'COP' ? exchangeRate : 1)) : '$0.00'}
                </div>
                <div className="col-span-2"></div>
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
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
