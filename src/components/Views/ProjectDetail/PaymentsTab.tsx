import { useEffect, useState } from 'react';
import { Plus, FileText, CheckCircle, Clock, DollarSign, Edit } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProjectCurrency } from '../../../hooks/useProjectCurrency';
import { AddContractModal } from '../../Modals/AddContractModal';
import { EditContractModal } from '../../Modals/EditContractModal';
import { ViewContractModal } from '../../Modals/ViewContractModal';
import type { Database } from '../../../lib/database.types';

type Contract = Database['public']['Tables']['contracts']['Row'];
type PaymentMilestone = Database['public']['Tables']['contract_payment_milestones']['Row'];

interface ContractWithMilestones extends Contract {
  milestones: PaymentMilestone[];
}

interface PaymentsTabProps {
  projectId: string;
}

export function PaymentsTab({ projectId }: PaymentsTabProps) {
  const { formatAmount } = useProjectCurrency(projectId);
  const [contracts, setContracts] = useState<ContractWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithMilestones | null>(null);

  useEffect(() => {
    loadContracts();
  }, [projectId]);

  async function loadContracts() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          milestones:contract_payment_milestones(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contractsWithSortedMilestones = (data || []).map(contract => ({
        ...contract,
        milestones: (contract.milestones || []).sort((a, b) => a.order_index - b.order_index)
      }));

      setContracts(contractsWithSortedMilestones as ContractWithMilestones[]);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }

  const totalContracted = contracts.reduce((sum, c) => sum + Number(c.total_value_usd), 0);
  const totalPaid = contracts.reduce((sum, c) => sum + Number(c.paid_amount_usd), 0);
  const totalPending = totalContracted - totalPaid;

  function handleEditContract(contract: ContractWithMilestones) {
    setSelectedContract(contract);
    setIsEditModalOpen(true);
  }

  function handleViewContract(contract: ContractWithMilestones) {
    setSelectedContract(contract);
    setIsViewModalOpen(true);
  }

  async function handleMarkAsPaid(contractId: string, milestoneId: string, amount: number) {
    if (!confirm('¿Marcar este hito de pago como pagado?')) {
      return;
    }

    try {
      const paidDate = new Date().toISOString();

      const { error: milestoneError } = await supabase
        .from('contract_payment_milestones')
        .update({
          status: 'paid',
          paid_date: paidDate,
        })
        .eq('id', milestoneId);

      if (milestoneError) throw milestoneError;

      const contract = contracts.find((c) => c.id === contractId);
      if (contract) {
        const newPaidAmount = Number(contract.paid_amount_usd) + amount;

        const { error: contractError } = await supabase
          .from('contracts')
          .update({
            paid_amount_usd: newPaidAmount,
          })
          .eq('id', contractId);

        if (contractError) throw contractError;
      }

      await loadContracts();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      alert('Error al marcar el pago. Por favor intente de nuevo.');
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Contratado</p>
            <p className="text-lg font-bold text-slate-800">{formatAmount(totalContracted)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Pagado</p>
            <p className="text-lg font-bold text-green-600">{formatAmount(totalPaid)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Por Pagar</p>
            <p className="text-lg font-bold text-orange-600">{formatAmount(totalPending)}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock size={16} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-lg">Contratos y Subcontratistas</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition shadow-sm flex items-center gap-1"
        >
          <Plus size={14} />
          Agregar Contrato
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando contratos...</div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No hay contratos registrados para este proyecto
        </div>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => {
            const pendingAmount = Number(contract.total_value_usd) - Number(contract.paid_amount_usd);
            const paymentProgress = (Number(contract.paid_amount_usd) / Number(contract.total_value_usd)) * 100;

            return (
              <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{contract.subcontractor_name}</h4>
                      <p className="text-xs text-gray-500">Servicio: {contract.service_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-400 text-right">Valor Total</p>
                      <p className="font-bold text-slate-800">
                        {formatAmount(Number(contract.total_value_usd))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditContract(contract)}
                        className="text-yellow-600 text-sm font-medium bg-white px-3 py-1.5 rounded border border-yellow-100 hover:bg-yellow-50 flex items-center gap-1 transition"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleViewContract(contract)}
                        className="text-blue-600 text-sm font-medium bg-white px-3 py-1.5 rounded border border-blue-100 hover:bg-blue-50 flex items-center gap-1 transition"
                      >
                        <FileText size={14} />
                        Ver
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {contract.milestones && contract.milestones.length > 0 ? (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Hitos de Pago
                      </h5>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-gray-400 text-xs uppercase border-b border-gray-100">
                            <th className="pb-2">Hito</th>
                            <th className="pb-2 text-center">%</th>
                            <th className="pb-2 text-right">Monto</th>
                            <th className="pb-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {contract.milestones.map((milestone) => (
                            <tr key={milestone.id}>
                              <td className="py-3 text-slate-700">{milestone.milestone_name}</td>
                              <td className="py-3 text-center text-gray-500">
                                {milestone.percentage}%
                              </td>
                              <td className="py-3 text-right font-medium">
                                {formatAmount(Number(milestone.amount_usd))}
                              </td>
                              <td className="py-3 text-center">
                                {milestone.status === 'paid' ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                                      <CheckCircle size={12} />
                                      Pagado
                                    </span>
                                    {milestone.paid_date && (
                                      <span className="text-xs text-gray-400">
                                        {new Date(milestone.paid_date).toLocaleDateString('es-ES')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleMarkAsPaid(contract.id, milestone.id, Number(milestone.amount_usd))}
                                    className="text-orange-600 hover:text-green-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto hover:bg-green-50 px-2 py-1 rounded transition"
                                  >
                                    <Clock size={12} />
                                    Marcar Pagado
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progreso de Pagos</span>
                          <span className="font-medium text-slate-800">
                            {paymentProgress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${paymentProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No hay hitos de pago configurados
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSuccess={loadContracts}
      />

      {selectedContract && (
        <>
          <EditContractModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedContract(null);
            }}
            contract={selectedContract}
            milestones={selectedContract.milestones}
            onSuccess={loadContracts}
          />
          <ViewContractModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedContract(null);
            }}
            contract={selectedContract}
            milestones={selectedContract.milestones}
          />
        </>
      )}
    </div>
  );
}
