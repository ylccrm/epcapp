import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Project {
  id: string;
  name: string;
}

interface Commitment {
  id: string;
  commitment_number: string;
  supplier_name: string;
  wbs_code: string;
  wbs_component: string;
  total_amount: number;
  invoiced_amount: number;
  paid_amount: number;
  status: string;
  discipline: string;
}

export function Payments() {
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState({
    totalBudget: 0,
    totalCommitted: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    pendingPayments: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadCommitments();
      loadStats();
    }
  }, [selectedProject]);

  async function loadProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  async function loadCommitments() {
    try {
      setLoading(true);

      const { data: commitmentsData, error: commitmentsError } = await supabase
        .from('purchase_commitments')
        .select(`
          *,
          supplier:suppliers(name),
          wbs_item:wbs_items(code, component, discipline)
        `)
        .eq('project_id', selectedProject)
        .order('commitment_number');

      if (commitmentsError) throw commitmentsError;

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('commitment_id, total_amount')
        .eq('project_id', selectedProject);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('commitment_id, amount')
        .eq('project_id', selectedProject)
        .eq('status', 'Pagado');

      const invoicesByCommitment = (invoicesData || []).reduce((acc: any, inv: any) => {
        acc[inv.commitment_id] = (acc[inv.commitment_id] || 0) + Number(inv.total_amount);
        return acc;
      }, {});

      const paymentsByCommitment = (paymentsData || []).reduce((acc: any, pay: any) => {
        acc[pay.commitment_id] = (acc[pay.commitment_id] || 0) + Number(pay.amount);
        return acc;
      }, {});

      const formatted = (commitmentsData || []).map((c: any) => ({
        id: c.id,
        commitment_number: c.commitment_number || 'N/A',
        supplier_name: c.supplier?.name || 'Sin proveedor',
        wbs_code: c.wbs_item?.code || 'N/A',
        wbs_component: c.wbs_item?.component || 'Sin categoría',
        discipline: c.wbs_item?.discipline || 'N/A',
        total_amount: Number(c.total_amount),
        invoiced_amount: invoicesByCommitment[c.id] || 0,
        paid_amount: paymentsByCommitment[c.id] || 0,
        status: c.status,
      }));

      setCommitments(formatted);
    } catch (error) {
      console.error('Error loading commitments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('total_budget_usd')
        .eq('id', selectedProject)
        .maybeSingle();

      const { data: commitmentsData } = await supabase
        .from('purchase_commitments')
        .select('total_amount')
        .eq('project_id', selectedProject);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('total_amount, due_date, status')
        .eq('project_id', selectedProject);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', selectedProject)
        .eq('status', 'Pagado');

      const totalCommitted = (commitmentsData || []).reduce(
        (sum, c) => sum + Number(c.total_amount),
        0
      );
      const totalInvoiced = (invoicesData || []).reduce(
        (sum, i) => sum + Number(i.total_amount),
        0
      );
      const totalPaid = (paymentsData || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      const today = new Date();
      const overdueCount = (invoicesData || []).filter(
        (i) =>
          i.status !== 'Pagada' &&
          i.due_date &&
          new Date(i.due_date) < today
      ).length;

      setStats({
        totalBudget: Number(projectData?.total_budget_usd || 0),
        totalCommitted,
        totalInvoiced,
        totalPaid,
        pendingPayments: totalInvoiced - totalPaid,
        overdueCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function toggleRow(id: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  }

  const executionPercentage =
    stats.totalCommitted > 0 ? (stats.totalPaid / stats.totalCommitted) * 100 : 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Control de Pagos</h1>
          <p className="text-gray-600">
            Gestión de compromisos, facturas y pagos del proyecto
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md">
            <Plus size={18} />
            Nuevo Compromiso
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proyecto
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option value="">Seleccionar proyecto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Comprometido
                </p>
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatAmount(stats.totalCommitted)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Órdenes de compra/servicio
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Pagado
                </p>
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatAmount(stats.totalPaid)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {executionPercentage.toFixed(1)}% ejecutado
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Saldo por Pagar
                </p>
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                {formatAmount(stats.pendingPayments)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Facturas pendientes</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pagos Vencidos
                </p>
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                {stats.overdueCount}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Facturas en mora</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">
                Compromisos y Pagos
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Filter size={16} />
                Filtros
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Cargando compromisos...
              </div>
            ) : commitments.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  No hay compromisos registrados
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Comienza creando una orden de compra o servicio
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-8"></th>
                      <th className="px-4 py-3 text-left">OC/OS</th>
                      <th className="px-4 py-3 text-left">Proveedor</th>
                      <th className="px-4 py-3 text-left">WBS</th>
                      <th className="px-4 py-3 text-left">Disciplina</th>
                      <th className="px-4 py-3 text-right">Comprometido</th>
                      <th className="px-4 py-3 text-right">Facturado</th>
                      <th className="px-4 py-3 text-right">Pagado</th>
                      <th className="px-4 py-3 text-right">Saldo</th>
                      <th className="px-4 py-3 text-center">% Ejec.</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commitments.map((commitment) => {
                      const balance =
                        commitment.total_amount - commitment.paid_amount;
                      const execPercentage =
                        commitment.total_amount > 0
                          ? (commitment.paid_amount / commitment.total_amount) *
                            100
                          : 0;
                      const isExpanded = expandedRows.has(commitment.id);

                      return (
                        <tr
                          key={commitment.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRow(commitment.id)}
                              className="text-gray-400 hover:text-gray-600 transition"
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {commitment.commitment_number}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {commitment.supplier_name}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-mono text-xs text-gray-500">
                                {commitment.wbs_code}
                              </p>
                              <p className="text-gray-700 text-xs">
                                {commitment.wbs_component}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {commitment.discipline}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatAmount(commitment.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatAmount(commitment.invoiced_amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-700 font-medium">
                            {formatAmount(commitment.paid_amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-700 font-medium">
                            {formatAmount(balance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${execPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600 font-medium">
                                {execPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                              {commitment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                title="Agregar factura"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                title="Registrar pago"
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                              >
                                <CreditCard size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
