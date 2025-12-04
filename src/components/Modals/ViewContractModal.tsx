import { X, FileText, Download, AlertCircle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Contract = Database['public']['Tables']['contracts']['Row'];
type PaymentMilestone = Database['public']['Tables']['contract_payment_milestones']['Row'];

interface ViewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  milestones: PaymentMilestone[];
}

export function ViewContractModal({ isOpen, onClose, contract, milestones }: ViewContractModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getFileExtension = (url: string) => {
    if (!url) return '';
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (url: string) => {
    const ext = getFileExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPdfFile = (url: string) => {
    const ext = getFileExtension(url);
    return ext === 'pdf';
  };

  const handleDownload = () => {
    if (contract.contract_pdf_url) {
      window.open(contract.contract_pdf_url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden m-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center">
              <FileText className="text-blue-500 mr-2" size={20} />
              Ver Contrato
            </h3>
            <p className="text-sm text-slate-400 mt-1">{contract.subcontractor_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {contract.contract_pdf_url ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Documento del Contrato
                  </span>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                >
                  <Download size={16} />
                  Descargar
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {isPdfFile(contract.contract_pdf_url) && (
                  <iframe
                    src={contract.contract_pdf_url}
                    className="w-full h-[600px]"
                    title="Contrato PDF"
                  />
                )}

                {isImageFile(contract.contract_pdf_url) && (
                  <div className="p-4 flex justify-center">
                    <img
                      src={contract.contract_pdf_url}
                      alt="Contrato"
                      className="max-w-full h-auto rounded shadow-lg"
                    />
                  </div>
                )}

                {!isPdfFile(contract.contract_pdf_url) && !isImageFile(contract.contract_pdf_url) && (
                  <div className="p-8 text-center">
                    <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-4">
                      Este tipo de archivo no se puede visualizar en el navegador.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                    >
                      <Download size={16} />
                      Descargar Archivo
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                No hay documento adjunto para este contrato
              </p>
              <p className="text-sm text-gray-500">
                Puedes agregar un documento al editar el contrato
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="font-bold text-sm text-slate-700 mb-4">Detalles del Contrato</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Subcontratista
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {contract.subcontractor_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Tipo de Servicio
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {contract.service_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Valor Total
                </p>
                <p className="text-sm font-bold text-slate-800">
                  ${Number(contract.total_value_usd).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} USD
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Monto Pagado
                </p>
                <p className="text-sm font-bold text-green-600">
                  ${Number(contract.paid_amount_usd).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} USD
                </p>
              </div>
            </div>

            {milestones && milestones.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
                  Hitos de Pago
                </p>
                <div className="space-y-2">
                  {milestones
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              milestone.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {milestone.milestone_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Number(milestone.percentage).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">
                            ${Number(milestone.amount_usd).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} USD
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              milestone.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                            }`}
                          >
                            {milestone.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
