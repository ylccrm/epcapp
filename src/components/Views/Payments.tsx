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
  Building2,
  Clock,
  Calendar,
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

interface ProjectSummary {
  project_id: string;
  project_name: string;
  total_committed: number;
  total_invoiced: number;
  total_paid: number;
  pending_payments: number;
  overdue_count: number;
  active_commitments: number;
}

interface PendingMilestone {
  milestone_id: string;
  milestone_name: string;
  commitment_id: string;
  commitment_number: string;
  supplier_name: string;
  supplier_id: string;
  wbs_code: string;
  wbs_component: string;
  discipline: string;
  amount: number;
  status: string;
  planned_date: string;
  completed_date: string | null;
  project_id: string;
  project_name: string;
}

interface SupplierDebt {
  supplier_id: string;
  supplier_name: string;
  total_committed: number;
  total_paid: number;
  total_pending: number;
  percentage_paid: number;
  percentage_pending: number;
  milestone_count: number;
}

export function Payments() {
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([]);
  const [pendingMilestones, setPendingMilestones] = useState<PendingMilestone[]>([]);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebt[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
    if (selectedProject === 'all') {
      loadAllProjectsData();
    } else if (selectedProject) {
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
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  async function loadAllProjectsData() {
    try {
      setLoading(true);

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (!projectsData) {
        setLoading(false);
        return;
      }

      const summaries: ProjectSummary[] = [];
      let totalCommitted = 0;
      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalOverdue = 0;

      for (const project of projectsData) {
        const { data: commitmentsData } = await supabase
          .from('purchase_commitments')
          .select('total_amount')
          .eq('project_id', project.id);

        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('total_amount, status, due_date')
          .eq('project_id', project.id);

        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount')
          .eq('project_id', project.id)
          .eq('status', 'Pagado');

        const committed = (commitmentsData || []).reduce((sum, c) => sum + Number(c.total_amount), 0);
        const invoiced = (invoicesData || []).reduce((sum, i) => sum + Number(i.total_amount), 0);
        const paid = (paymentsData || []).reduce((sum, p) => sum + Number(p.amount), 0);

        const today = new Date();
        const overdue = (invoicesData || []).filter(
          (i) => i.status !== 'Pagada' && i.due_date && new Date(i.due_date) < today
        ).length;

        totalCommitted += committed;
        totalInvoiced += invoiced;
        totalPaid += paid;
        totalOverdue += overdue;

        summaries.push({
          project_id: project.id,
          project_name: project.name,
          total_committed: committed,
          total_invoiced: invoiced,
          total_paid: paid,
          pending_payments: invoiced - paid,
          overdue_count: overdue,
          active_commitments: (commitmentsData || []).length,
        });
      }

      setProjectSummaries(summaries);
      setStats({
        totalBudget: 0,
        totalCommitted,
        totalInvoiced,
        totalPaid,
        pendingPayments: totalInvoiced - totalPaid,
        overdueCount: totalOverdue,
      });

      await loadPendingMilestones();
    } catch (error) {
      console.error('Error loading all projects data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingMilestones() {
    try {
      const { data, error } = await supabase
        .from('payment_milestones')
        .select(`
          id,
          milestone_name,
          amount,
          status,
          planned_date,
          completed_date,
          commitment:purchase_commitments(
            id,
            commitment_number,
            project_id,
            supplier_id,
            project:projects(id, name),
            supplier:suppliers(id, name),
            wbs_item:wbs_items(code, component, discipline)
          )
        `)
        .order('planned_date');

      if (error) throw error;

      const allFormatted = (data || [])
        .filter((m: any) => m.commitment)
        .map((m: any) => ({
          milestone_id: m.id,
          milestone_name: m.milestone_name,
          commitment_id: m.commitment.id,
          commitment_number: m.commitment.commitment_number,
          supplier_id: m.commitment.supplier_id || '',
          supplier_name: m.commitment.supplier?.name || 'Sin proveedor',
          wbs_code: m.commitment.wbs_item?.code || 'N/A',
          wbs_component: m.commitment.wbs_item?.component || 'Sin categoría',
          discipline: m.commitment.wbs_item?.discipline || 'N/A',
          amount: Number(m.amount),
          status: m.status,
          planned_date: m.planned_date,
          completed_date: m.completed_date,
          project_id: m.commitment.project_id,
          project_name: m.commitment.project?.name || 'Sin nombre',
        }));

      const pendingOnly = allFormatted.filter((m) => m.status !== 'Pagado');
      setPendingMilestones(allFormatted);
      calculateSupplierDebts(allFormatted);
    } catch (error) {
      console.error('Error loading pending milestones:', error);
    }
  }

  function calculateSupplierDebts(milestones: PendingMilestone[]) {
    const supplierMap = new Map<string, SupplierDebt>();

    milestones.forEach((milestone) => {
      const supplierId = milestone.supplier_id || 'unknown';
      const supplierName = milestone.supplier_name;

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplier_id: supplierId,
          supplier_name: supplierName,
          total_committed: 0,
          total_paid: 0,
          total_pending: 0,
          percentage_paid: 0,
          percentage_pending: 0,
          milestone_count: 0,
        });
      }

      const supplier = supplierMap.get(supplierId)!;
      supplier.total_committed += milestone.amount;
      supplier.milestone_count += 1;

      if (milestone.status === 'Pagado') {
        supplier.total_paid += milestone.amount;
      } else {
        supplier.total_pending += milestone.amount;
      }
    });

    const debts = Array.from(supplierMap.values()).map((supplier) => ({
      ...supplier,
      percentage_paid:
        supplier.total_committed > 0
          ? (supplier.total_paid / supplier.total_committed) * 100
          : 0,
      percentage_pending:
        supplier.total_committed > 0
          ? (supplier.total_pending / supplier.total_committed) * 100
          : 100,
    }));

    debts.sort((a, b) => b.total_pending - a.total_pending);
    setSupplierDebts(debts);
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

  function toggleProject(projectId: string) {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  }

  const executionPercentage =
    stats.totalCommitted > 0 ? (stats.totalPaid / stats.totalCommitted) * 100 : 0;

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Pendiente':
        return 'bg-gray-100 text-gray-700';
      case 'Cumplido':
        return 'bg-orange-100 text-orange-700';
      case 'Facturado':
        return 'bg-blue-100 text-blue-700';
      case 'Pagado':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Control de Pagos</h1>
          <p className="text-gray-600">
            Gestión de compromisos, facturas y pagos
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
          Vista
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option value="all">Todos los Proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

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

      {selectedProject === 'all' ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} />
                Resumen por Proyecto
              </h3>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Cargando resumen de proyectos...
              </div>
            ) : projectSummaries.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  No hay proyectos con datos de pago
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">Proyecto</th>
                      <th className="px-6 py-3 text-center">Compromisos</th>
                      <th className="px-6 py-3 text-right">Total Comprometido</th>
                      <th className="px-6 py-3 text-right">Total Pagado</th>
                      <th className="px-6 py-3 text-right">Saldo Pendiente</th>
                      <th className="px-6 py-3 text-center">% Ejecutado</th>
                      <th className="px-6 py-3 text-center">Vencidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projectSummaries.map((summary) => {
                      const execPercentage =
                        summary.total_committed > 0
                          ? (summary.total_paid / summary.total_committed) * 100
                          : 0;

                      return (
                        <tr key={summary.project_id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-blue-600" />
                              <span className="font-semibold text-slate-800">
                                {summary.project_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                              {summary.active_commitments}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">
                            {formatAmount(summary.total_committed)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-green-700">
                            {formatAmount(summary.total_paid)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-orange-700">
                            {formatAmount(summary.pending_payments)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-green-600 h-2.5 rounded-full transition-all"
                                  style={{ width: `${Math.min(execPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-700 font-semibold min-w-[40px]">
                                {execPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {summary.overdue_count > 0 ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                {summary.overdue_count}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" />
                  Cumplimiento del Cronograma de Pagos
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Progreso de los hitos de pago
                </p>
              </div>
              <div className="p-6">
                {(() => {
                  const totalMilestones = pendingMilestones.length;
                  const paidMilestones = pendingMilestones.filter(
                    (m) => m.status === 'Pagado'
                  ).length;
                  const totalAmount = pendingMilestones.reduce(
                    (sum, m) => sum + m.amount,
                    0
                  );
                  const paidAmount = pendingMilestones
                    .filter((m) => m.status === 'Pagado')
                    .reduce((sum, m) => sum + m.amount, 0);
                  const percentageByCount =
                    totalMilestones > 0 ? (paidMilestones / totalMilestones) * 100 : 0;
                  const percentageByAmount =
                    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

                  return (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Por Cantidad de Hitos
                          </span>
                          <span className="text-sm font-bold text-blue-700">
                            {paidMilestones} / {totalMilestones}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(percentageByCount, 100)}%` }}
                          >
                            {percentageByCount > 10 && (
                              <span className="text-xs font-bold text-white">
                                {percentageByCount.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {percentageByCount <= 10 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {percentageByCount.toFixed(1)}% completado
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Por Monto Total
                          </span>
                          <span className="text-sm font-bold text-green-700">
                            {formatAmount(paidAmount)} / {formatAmount(totalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(percentageByAmount, 100)}%` }}
                          >
                            {percentageByAmount > 10 && (
                              <span className="text-xs font-bold text-white">
                                {percentageByAmount.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {percentageByAmount <= 10 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {percentageByAmount.toFixed(1)}% completado
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Pendientes</p>
                            <p className="text-lg font-bold text-orange-700">
                              {pendingMilestones.filter((m) => m.status === 'Pendiente')
                                .length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">En Proceso</p>
                            <p className="text-lg font-bold text-blue-700">
                              {pendingMilestones.filter(
                                (m) => m.status === 'Cumplido' || m.status === 'Facturado'
                              ).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Pagados</p>
                            <p className="text-lg font-bold text-green-700">
                              {paidMilestones}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-600" />
                  Deuda por Proveedor
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Porcentaje pendiente de pago por proveedor
                </p>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {supplierDebts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No hay datos de proveedores
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplierDebts.slice(0, 10).map((supplier) => (
                      <div
                        key={supplier.supplier_id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-800">
                              {supplier.supplier_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {supplier.milestone_count} hitos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Pendiente</p>
                            <p className="text-sm font-bold text-orange-700">
                              {formatAmount(supplier.total_pending)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(supplier.percentage_pending, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-orange-700 min-w-[45px] text-right">
                            {supplier.percentage_pending.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-600">
                          <span>Pagado: {formatAmount(supplier.total_paid)}</span>
                          <span>Total: {formatAmount(supplier.total_committed)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                Hitos de Pago Pendientes
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Compromisos con montos pendientes de pago organizados por proyecto
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Cargando hitos pendientes...
              </div>
            ) : pendingMilestones.filter((m) => m.status !== 'Pagado').length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  No hay hitos de pago pendientes
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Todos los hitos están pagados o no hay datos disponibles
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {projects
                  .filter((p) =>
                    pendingMilestones.some(
                      (m) => m.project_id === p.id && m.status !== 'Pagado'
                    )
                  )
                  .map((project) => {
                    const projectMilestones = pendingMilestones.filter(
                      (m) => m.project_id === project.id && m.status !== 'Pagado'
                    );
                    const isExpanded = expandedProjects.has(project.id);

                    return (
                      <div key={project.id}>
                        <div
                          className="px-6 py-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between"
                          onClick={() => toggleProject(project.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown size={20} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={20} className="text-gray-500" />
                            )}
                            <Building2 size={18} className="text-blue-600" />
                            <span className="font-bold text-slate-800">
                              {project.name}
                            </span>
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                              {projectMilestones.length} hitos
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-700">
                              {formatAmount(
                                projectMilestones.reduce((sum, m) => sum + m.amount, 0)
                              )}
                            </p>
                            <p className="text-xs text-gray-500">pendiente</p>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-white">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                                <tr>
                                  <th className="px-6 py-3 text-left">OC/OS</th>
                                  <th className="px-6 py-3 text-left">Proveedor</th>
                                  <th className="px-6 py-3 text-left">Hito</th>
                                  <th className="px-6 py-3 text-left">WBS</th>
                                  <th className="px-6 py-3 text-left">Disciplina</th>
                                  <th className="px-6 py-3 text-right">Monto</th>
                                  <th className="px-6 py-3 text-center">Estado</th>
                                  <th className="px-6 py-3 text-center">Fecha Planeada</th>
                                  <th className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {projectMilestones.map((milestone) => (
                                  <tr
                                    key={milestone.milestone_id}
                                    className="hover:bg-gray-50 transition"
                                  >
                                    <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-800">
                                      {milestone.commitment_number}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">
                                      {milestone.supplier_name}
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="font-medium text-slate-800">
                                        {milestone.milestone_name}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <div>
                                        <p className="font-mono text-xs text-gray-500">
                                          {milestone.wbs_code}
                                        </p>
                                        <p className="text-gray-700 text-xs">
                                          {milestone.wbs_component}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                        {milestone.discipline}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-orange-700">
                                      {formatAmount(milestone.amount)}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                          milestone.status
                                        )}`}
                                      >
                                        {milestone.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="text-xs text-gray-600">
                                          {formatDate(milestone.planned_date)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          title="Facturar"
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
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Compromisos y Pagos</h3>
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
                    const balance = commitment.total_amount - commitment.paid_amount;
                    const execPercentage =
                      commitment.total_amount > 0
                        ? (commitment.paid_amount / commitment.total_amount) * 100
                        : 0;
                    const isExpanded = expandedRows.has(commitment.id);

                    return (
                      <tr key={commitment.id} className="hover:bg-gray-50 transition">
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
      )}
    </div>
  );
}
