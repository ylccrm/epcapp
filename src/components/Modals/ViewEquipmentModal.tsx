import { X, FileText, Download, Calendar, Package, AlertTriangle } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Equipment = Database['public']['Tables']['project_equipment']['Row'];

interface ViewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
}

export function ViewEquipmentModal({ isOpen, onClose, equipment }: ViewEquipmentModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getEquipmentTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      inverter: 'Inversor',
      panel_batch: 'Panel Solar',
      meter: 'Medidor',
      transformer: 'Transformador',
      battery: 'Batería',
      other: 'Otro',
    };
    return type ? types[type] || type : 'N/A';
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateWarrantyExpiry = () => {
    if (!equipment.installation_date || !equipment.warranty_years) return null;
    const installDate = new Date(equipment.installation_date);
    const expiryDate = new Date(installDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + equipment.warranty_years);
    return expiryDate;
  };

  const warrantyExpiry = calculateWarrantyExpiry();
  const isWarrantyExpired = warrantyExpiry && warrantyExpiry < new Date();

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden m-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center">
              <Package className="text-blue-500 mr-2" size={20} />
              Detalles del Equipo
            </h3>
            <p className="text-sm text-slate-400 mt-1">{equipment.equipment_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-sm text-slate-700 mb-4">Información General</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Nombre del Equipo
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {equipment.equipment_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Tipo de Equipo
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {getEquipmentTypeLabel(equipment.equipment_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Número de Serie
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {equipment.serial_number || 'No especificado'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Proveedor
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {equipment.supplier || 'No especificado'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-sm text-slate-700 mb-4 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={16} />
              Fechas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Fecha de Compra
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(equipment.purchase_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Fecha de Instalación
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(equipment.installation_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-sm text-slate-700 mb-4">Garantía</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Años de Garantía
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {equipment.warranty_years || 0} años
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Vencimiento de Garantía
                </p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${isWarrantyExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {warrantyExpiry ? formatDate(warrantyExpiry.toISOString().split('T')[0]) : 'No calculado'}
                  </p>
                  {isWarrantyExpired && (
                    <AlertTriangle size={16} className="text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {equipment.notes && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-sm text-slate-700 mb-2">Notas</h4>
              <p className="text-sm text-gray-700">{equipment.notes}</p>
            </div>
          )}

          {(equipment.manual_url || equipment.invoice_url) && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-sm text-slate-700 mb-4">Documentos</h4>
              <div className="space-y-3">
                {equipment.manual_url && (
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Manual del Equipo
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(equipment.manual_url!)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                    >
                      <Download size={16} />
                      Descargar
                    </button>
                  </div>
                )}
                {equipment.invoice_url && (
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Factura de Compra
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(equipment.invoice_url!)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                    >
                      <Download size={16} />
                      Descargar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
