import { useEffect, useState } from 'react';
import { Server, Plus, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { RegisterEquipmentModal } from '../../Modals/RegisterEquipmentModal';
import { ViewEquipmentModal } from '../../Modals/ViewEquipmentModal';
import type { Database } from '../../../lib/database.types';

type ProjectEquipment = Database['public']['Tables']['project_equipment']['Row'];

interface EquipmentTabProps {
  projectId: string;
}

export function EquipmentTab({ projectId }: EquipmentTabProps) {
  const [equipment, setEquipment] = useState<ProjectEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<ProjectEquipment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, [projectId]);

  async function loadEquipment() {
    try {
      const { data, error } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  }

  const getEquipmentTypeLabel = (type: string | null) => {
    if (!type) return 'Otro';
    const labels: Record<string, string> = {
      inverter: 'Inversor',
      panel_batch: 'Lote de Paneles',
      transformer: 'Transformador',
      meter: 'Medidor',
      battery: 'Batería',
      other: 'Otro',
    };
    return labels[type] || 'Otro';
  };

  const getEquipmentTypeIcon = (type: string | null) => {
    const icons: Record<string, string> = {
      inverter: '⚡',
      panel_batch: '☀️',
      transformer: '🔌',
      meter: '📊',
      battery: '🔋',
      other: '⚙️',
    };
    return icons[type || 'other'] || '⚙️';
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-slate-700">Inventario de Equipos Principales (Activos)</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white text-xs px-3 py-1 rounded shadow-sm hover:bg-slate-800 flex items-center gap-1"
          >
            <Plus size={14} />
            Registrar Equipo
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando equipos...</div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay equipos registrados para este proyecto
          </div>
        ) : (
          <div className="p-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="pb-2">Equipo / Tipo</th>
                  <th className="pb-2"># Serie</th>
                  <th className="pb-2">Proveedor</th>
                  <th className="pb-2">Fecha Instalación</th>
                  <th className="pb-2 text-center">Garantía</th>
                  <th className="pb-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {getEquipmentTypeIcon(item.equipment_type)}
                        </span>
                        <div>
                          <div className="font-medium text-slate-800">{item.equipment_name}</div>
                          <div className="text-xs text-gray-500">
                            {getEquipmentTypeLabel(item.equipment_type)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 font-mono text-xs">
                      {item.serial_number || '-'}
                    </td>
                    <td className="py-3 text-gray-600">{item.supplier || '-'}</td>
                    <td className="py-3 text-gray-600">
                      {item.installation_date
                        ? new Date(item.installation_date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 text-center">
                      {item.warranty_years > 0 ? (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">
                          {item.warranty_years} Años
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedEquipment(item);
                          setIsViewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegisterEquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSuccess={loadEquipment}
      />

      {selectedEquipment && (
        <ViewEquipmentModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedEquipment(null);
          }}
          equipment={selectedEquipment}
        />
      )}
    </div>
  );
}
