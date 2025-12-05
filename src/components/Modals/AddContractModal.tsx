import { useState, useEffect } from 'react';
import { X, Save, Plus, Upload, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';

interface PaymentMilestone {
  milestone_name: string;
  percentage: number;
  amount_usd: number;
  status: 'pending' | 'paid';
  order_index: number;
}

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function AddContractModal({ isOpen, onClose, projectId, onSuccess }: AddContractModalProps) {
  const { currency, exchangeRate } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [subcontractor, setSubcontractor] = useState('');
  const [serviceType, setServiceType] = useState('Instalación Eléctrica');
  const [totalValue, setTotalValue] = useState('');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([
    { milestone_name: 'Anticipo', percentage: 30, amount_usd: 0, status: 'pending', order_index: 1 },
    { milestone_name: 'Entrega Final', percentage: 70, amount_usd: 0, status: 'pending', order_index: 2 },
  ]);

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

    setMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount_usd: (totalInUSD * m.percentage) / 100,
      }))
    );
  };

  const handleMilestoneChange = (index: number, field: keyof PaymentMilestone, value: any) => {
    setMilestones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === 'percentage' && totalValue) {
      calculateMilestoneAmounts(parseFloat(totalValue));
    }
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        milestone_name: 'Nuevo Hito',
        percentage: 0,
        amount_usd: 0,
        status: 'pending',
        order_index: prev.length + 1,
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) {
      alert('Debe haber al menos un hito de pago');
      return;
    }
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const getTotalPercentage = () => {
    return milestones.reduce((sum, m) => sum + m.percentage, 0);
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

      let contractFileUrl: string | null = null;

      if (contractFile) {
        const fileExt = contractFile.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${subcontractor.replace(/\s+/g, '-')}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(fileName, contractFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('contracts')
          .getPublicUrl(fileName);

        contractFileUrl = urlData.publicUrl;
      }

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([
          {
            project_id: projectId,
            subcontractor_name: subcontractor,
            service_type: serviceType,
            total_value_usd: totalInUSD,
            paid_amount_usd: 0,
            contract_pdf_url: contractFileUrl,
          },
        ])
        .select()
        .single();

      if (contractError) throw contractError;

      if (contractData) {
        const milestonesData = milestones.map((m) => ({
          contract_id: contractData.id,
          milestone_name: m.milestone_name,
          percentage: m.percentage,
          amount_usd: m.amount_usd,
          status: m.status,
          order_index: m.order_index,
        }));

        const { error: milestonesError } = await supabase
          .from('contract_payment_milestones')
          .insert(milestonesData);

        if (milestonesError) throw milestonesError;
      }

      setSubcontractor('');
      setServiceType('Instalación Eléctrica');
      setTotalValue('');
      setContractFile(null);
      setMilestones([
        { milestone_name: 'Anticipo', percentage: 30, amount_usd: 0, status: 'pending', order_index: 1 },
        { milestone_name: 'Entrega Final', percentage: 70, amount_usd: 0, status: 'pending', order_index: 2 },
      ]);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating contract:', error);

      let errorMessage = 'Error al crear el contrato. Por favor intente de nuevo.';

      if (error.message?.includes('storage')) {
        errorMessage = 'Error al subir el archivo. Verifica que el archivo sea válido y no exceda 50MB.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
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
            <i className="fas fa-file-signature text-yellow-500 mr-2"></i>
            Nuevo Subcontrato
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Documento del Contrato (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-yellow-500 transition">
                <input
                  type="file"
                  id="contract-file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="contract-file"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {contractFile ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <FileText size={20} />
                      <span>{contractFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click para subir PDF, Word o Imagen
                      </span>
                      <span className="text-xs text-gray-400">
                        Formatos: PDF, DOC, DOCX, JPG, PNG
                      </span>
                    </div>
                  )}
                </label>
                {contractFile && (
                  <button
                    type="button"
                    onClick={() => setContractFile(null)}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Eliminar archivo
                  </button>
                )}
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
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={milestone.milestone_name}
                        onChange={(e) => handleMilestoneChange(index, 'milestone_name', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        placeholder="Nombre del hito"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={milestone.percentage}
                        onChange={(e) => handleMilestoneChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </div>
                    <div className="col-span-3 text-right text-sm font-medium text-slate-700">
                      {formatAmount(milestone.amount_usd)}
                    </div>
                    <div className="col-span-2 text-right">
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
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
              {loading ? 'Guardando...' : 'Guardar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
