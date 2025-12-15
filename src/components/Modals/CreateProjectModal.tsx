import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { currency, exchangeRate } = useCurrency();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    projectType: 'Industrial',
    capacity: '',
    capacityUnit: 'kWp',
    installationType: 'Techo (Roof)',
    location: '',
    budget: '',
    startDate: '',
    endDate: '',
    currencyCountry: 'Colombia',
    projectCurrency: 'COP',
    projectExchangeRate: '4000',
  });

  const COUNTRY_CURRENCIES: Record<string, { currency: string; rate: number }> = {
    'Colombia': { currency: 'COP', rate: 4000 },
    'United States': { currency: 'USD', rate: 1 },
    'Mexico': { currency: 'MXN', rate: 17 },
    'Brazil': { currency: 'BRL', rate: 5 },
    'Argentina': { currency: 'ARS', rate: 350 },
    'Chile': { currency: 'CLP', rate: 900 },
    'Peru': { currency: 'PEN', rate: 3.7 },
    'Spain': { currency: 'EUR', rate: 0.92 },
    'United Kingdom': { currency: 'GBP', rate: 0.79 },
    'Canada': { currency: 'CAD', rate: 1.35 },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'currencyCountry') {
      const currencyInfo = COUNTRY_CURRENCIES[value];
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        projectCurrency: currencyInfo?.currency || 'USD',
        projectExchangeRate: currencyInfo?.rate.toString() || '1',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      if (!formData.name || !formData.client || !formData.capacity || !formData.location || !formData.budget) {
        throw new Error('Por favor complete todos los campos obligatorios');
      }

      let budgetUSD = parseFloat(formData.budget) || 0;
      const projectExchangeRate = parseFloat(formData.projectExchangeRate) || 1;

      if (formData.projectCurrency !== 'USD' && budgetUSD > 0) {
        budgetUSD = budgetUSD / projectExchangeRate;
      }

      const projectName = `${formData.name} - ${formData.capacity}${formData.capacityUnit}`;

      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: projectName,
            client: formData.client,
            status: 'draft',
            total_budget_usd: budgetUSD,
            start_date: formData.startDate || null,
            location: formData.location,
            currency: formData.projectCurrency,
            currency_country: formData.currencyCountry,
            exchange_rate: projectExchangeRate,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error al insertar proyecto:', error);
        throw new Error(`Error de base de datos: ${error.message}`);
      }

      if (data) {
        const standardMilestones = [
          { name: '1. Ingeniería y Diseños', defaultSubcontractor: 'Ingeniería & Diseños S.A.S' },
          { name: '2. Instalación de Estructura', defaultSubcontractor: 'Equipo Alpha' },
          { name: '3. Líneas de Vida (HSE)', defaultSubcontractor: 'Seguridad Alturas Ltda' },
          { name: '4. Instalación Bandejería', defaultSubcontractor: 'Montajes del Norte' },
          { name: '5. Instalación Cableado DC/AC', defaultSubcontractor: 'Montajes del Norte' },
          { name: '6. Instalación Paneles Solares', defaultSubcontractor: 'Equipo Alpha' },
          { name: '7. Apantallamiento (Pararrayos)', defaultSubcontractor: 'Montajes del Norte' },
        ];

        const milestones = standardMilestones.map((m, index) => ({
          project_id: data.id,
          name: m.name,
          progress_percentage: 0,
          subcontractor_name: m.defaultSubcontractor,
          order_index: index + 1,
        }));

        const { error: milestonesError } = await supabase
          .from('project_milestones')
          .insert(milestones);

        if (milestonesError) {
          console.error('Error al crear hitos:', milestonesError);
          throw new Error(`Error al crear hitos: ${milestonesError.message}`);
        }

        setFormData({
          name: '',
          client: '',
          projectType: 'Industrial',
          capacity: '',
          capacityUnit: 'kWp',
          installationType: 'Techo (Roof)',
          location: '',
          budget: '',
          startDate: '',
          endDate: '',
          currencyCountry: 'Colombia',
          projectCurrency: 'COP',
          projectExchangeRate: '4000',
        });

        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating project:', error);

      let errorMessage = 'Error al crear el proyecto. Por favor intente de nuevo.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Error de permisos. Verifica que estés autenticado.';
      } else if (error.code === '23505') {
        errorMessage = 'Ya existe un proyecto con ese nombre.';
      }

      alert(errorMessage);
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
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Proyecto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Ej: Granja Solar Del Sur"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Nombre Cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Proyecto
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              >
                <option>Industrial</option>
                <option>Comercial</option>
                <option>Residencial</option>
                <option>Granja Solar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad Instalada
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="100"
                />
                <select
                  name="capacityUnit"
                  value={formData.capacityUnit}
                  onChange={handleChange}
                  className="border border-l-0 border-gray-300 rounded-r-lg px-2 bg-gray-50 text-gray-600 focus:outline-none text-sm"
                >
                  <option>kWp</option>
                  <option>MWp</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Instalación
              </label>
              <select
                name="installationType"
                value={formData.installationType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              >
                <option>Techo (Roof)</option>
                <option>Piso (Ground)</option>
                <option>Carport</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Ciudad/Sitio"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuración de Moneda</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                <select
                  name="currencyCountry"
                  value={formData.currencyCountry}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-sm"
                >
                  <option>Colombia</option>
                  <option>United States</option>
                  <option>Mexico</option>
                  <option>Brazil</option>
                  <option>Argentina</option>
                  <option>Chile</option>
                  <option>Peru</option>
                  <option>Spain</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
                <input
                  type="text"
                  value={formData.projectCurrency}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 bg-gray-50 text-gray-700 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tasa a USD</label>
                <input
                  type="number"
                  name="projectExchangeRate"
                  value={formData.projectExchangeRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs font-bold mt-0.5">
                  {formData.projectCurrency}
                </span>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin Programado
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
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
              className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
