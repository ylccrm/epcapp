import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Building2,
  Clock,
  Calendar,
  Upload,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CircleDot,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import { UploadPaymentReceiptModal } from '../Modals/UploadPaymentReceiptModal';

interface Project {
  id: string;
  name: string;
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
  payment_receipt_url?: string | null;
  paid_date?: string | null;
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

interface ProjectSupplierGroup {
  project_id: string;
  project_name: string;
  supplier_id: string;
  supplier_name: string;
  total_pending: number;
  total_paid: number;
  total_committed: number;
  percentage_paid: number;
  milestones: PendingMilestone[];
}

export function Payments() {
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([]);
  const [pendingMilestones, setPendingMilestones] = useState<PendingMilestone[]>([]);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebt[]>([]);
  const [projectSupplierGroups, setProjectSupplierGroups] = useState<ProjectSupplierGroup[]>([]);
  const [expandedSupplierGroups, setExpandedSupplierGroups] = useState<Set<string>>(new Set());
  const [uploadReceiptModal, setUploadReceiptModal] = useState<{
    isOpen: boolean;
    milestoneId: string;
    milestoneName: string;
  }>({
    isOpen: false,
    milestoneId: '',
    milestoneName: '',
  });
  const [sortByStatus, setSortByStatus] = useState<'asc' | 'desc' | null>(null);

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
      loadAllProjectsData();
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
          payment_receipt_url,
          paid_date,
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
          wbs_component: m.commitment.wbs_item?.component || 'Sin categoria',
          discipline: m.commitment.wbs_item?.discipline || 'N/A',
          amount: Number(m.amount),
          status: m.status,
          planned_date: m.planned_date,
          completed_date: m.completed_date,
          project_id: m.commitment.project_id,
          project_name: m.commitment.project?.name || 'Sin nombre',
          payment_receipt_url: m.payment_receipt_url,
          paid_date: m.paid_date,
        }));

      setPendingMilestones(allFormatted);
      calculateSupplierDebts(allFormatted);
      calculateProjectSupplierGroups(allFormatted);
    } catch (error) {
      console.error('Error loading pending milestones:', error);
    }
  }

  function calculateProjectSupplierGroups(milestones: PendingMilestone[]) {
    const groupMap = new Map<string, ProjectSupplierGroup>();

    milestones.forEach((milestone) => {
      const key = `${milestone.project_id}-${milestone.supplier_id}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          project_id: milestone.project_id,
          project_name: milestone.project_name,
          supplier_id: milestone.supplier_id,
          supplier_name: milestone.supplier_name,
          total_pending: 0,
          total_paid: 0,
          total_committed: 0,
          percentage_paid: 0,
          milestones: [],
        });
      }

      const group = groupMap.get(key)!;
      group.milestones.push(milestone);
      group.total_committed += milestone.amount;

      if (milestone.status === 'Pagado') {
        group.total_paid += milestone.amount;
      } else {
        group.total_pending += milestone.amount;
      }
    });

    const groups = Array.from(groupMap.values()).map((group) => ({
      ...group,
      percentage_paid:
        group.total_committed > 0
          ? (group.total_paid / group.total_committed) * 100
          : 0,
    }));

    groups.sort((a, b) => {
      if (a.project_name !== b.project_name) {
        return a.project_name.localeCompare(b.project_name);
      }
      return b.total_pending - a.total_pending;
    });

    setProjectSupplierGroups(groups);
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

  const handleSortByStatus = () => {
    if (sortByStatus === null || sortByStatus === 'desc') {
      setSortByStatus('asc');
    } else {
      setSortByStatus('desc');
    }
  };

  const getSortedGroups = () => {
    if (!sortByStatus) return projectSupplierGroups;

    const statusOrder: { [key: string]: number } = {
      'Pendiente': 1,
      'Cumplido': 2,
      'Pagado': 3,
    };

    return [...projectSupplierGroups].map(group => ({
      ...group,
      milestones: [...group.milestones].sort((a, b) => {
        const orderA = statusOrder[a.status] || 0;
        const orderB = statusOrder[b.status] || 0;

        if (sortByStatus === 'asc') {
          return orderA - orderB;
        } else {
          return orderB - orderA;
        }
      })
    }));
  };

  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'Pagado') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          updateData.paid_date = new Date().toISOString().split('T')[0];
          updateData.paid_by = user.id;
        }
      }

      const { error } = await supabase
        .from('payment_milestones')
        .update(updateData)
        .eq('id', milestoneId);

      if (error) throw error;

      await loadPendingMilestones();
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

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

  const executionPercentage =
    stats.totalCommitted > 0 ? (stats.totalPaid / stats.totalCommitted) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'mac-badge mac-badge-orange';
      case 'Cumplido':
        return 'mac-badge mac-badge-yellow';
      case 'Pagado':
        return 'mac-badge mac-badge-green';
      default:
        return 'mac-badge mac-badge-gray';
    }
  };

  const filteredGroups = selectedProject === 'all'
    ? getSortedGroups()
    : getSortedGroups().filter((g) => g.project_id === selectedProject);

  return (
    <div className="p-8 bg-mac-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-mac-gray-900 mb-1">Control de Pagos</h1>
        <p className="text-mac-gray-500 text-sm">
          Gestion de compromisos y pagos a proveedores
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="mac-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-mac-blue-50 flex items-center justify-center">
              <DollarSign size={20} className="text-mac-blue-500" />
            </div>
            <span className="text-xs font-medium text-mac-gray-400 uppercase tracking-wide">Comprometido</span>
          </div>
          <h3 className="text-2xl font-semibold text-mac-gray-900">
            {formatAmount(stats.totalCommitted)}
          </h3>
          <p className="text-xs text-mac-gray-500 mt-1">Total en ordenes de compra</p>
        </div>

        <div className="mac-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-mac-gray-400 uppercase tracking-wide">Pagado</span>
          </div>
          <h3 className="text-2xl font-semibold text-mac-gray-900">
            {formatAmount(stats.totalPaid)}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 mac-progress-bar">
              <div className="mac-progress-bar-fill bg-emerald-500" style={{ width: `${Math.min(executionPercentage, 100)}%` }}></div>
            </div>
            <span className="text-xs font-medium text-emerald-600">{executionPercentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="mac-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-amber-500" />
            </div>
            <span className="text-xs font-medium text-mac-gray-400 uppercase tracking-wide">Pendiente</span>
          </div>
          <h3 className="text-2xl font-semibold text-mac-gray-900">
            {formatAmount(stats.pendingPayments)}
          </h3>
          <p className="text-xs text-mac-gray-500 mt-1">Por pagar a proveedores</p>
        </div>

        <div className="mac-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <span className="text-xs font-medium text-mac-gray-400 uppercase tracking-wide">Vencidos</span>
          </div>
          <h3 className="text-2xl font-semibold text-mac-gray-900">{stats.overdueCount}</h3>
          <p className="text-xs text-mac-gray-500 mt-1">Pagos en mora</p>
        </div>
      </div>

      <div className="mac-card mb-6">
        <div className="p-4 border-b border-mac-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mac-blue-50 flex items-center justify-center">
              <Building2 size={16} className="text-mac-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-mac-gray-900">Hitos de Pago</h2>
              <p className="text-xs text-mac-gray-500">Control de pagos por proveedor</p>
            </div>
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="mac-select text-sm min-w-[200px]"
          >
            <option value="all">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-mac-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-mac-gray-500 text-sm">Cargando datos...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-mac-gray-100 flex items-center justify-center mx-auto mb-3">
              <DollarSign size={24} className="text-mac-gray-400" />
            </div>
            <p className="text-mac-gray-600 font-medium">No hay hitos de pago</p>
            <p className="text-sm text-mac-gray-400 mt-1">
              No se encontraron compromisos para el filtro seleccionado
            </p>
          </div>
        ) : (
          <div className="divide-y divide-mac-gray-100">
            {filteredGroups.map((group) => {
              const groupKey = `${group.project_id}-${group.supplier_id}`;
              const isExpanded = expandedSupplierGroups.has(groupKey);

              return (
                <div key={groupKey}>
                  <div
                    className="px-5 py-4 hover:bg-mac-blue-50/50 transition-colors cursor-pointer flex items-center gap-4"
                    onClick={() => {
                      const newExpanded = new Set(expandedSupplierGroups);
                      if (isExpanded) {
                        newExpanded.delete(groupKey);
                      } else {
                        newExpanded.add(groupKey);
                      }
                      setExpandedSupplierGroups(newExpanded);
                    }}
                  >
                    <button className="text-mac-gray-400 hover:text-mac-gray-600 transition shrink-0">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-mac-gray-900">{group.supplier_name}</span>
                        <span className="text-xs text-mac-gray-400">en</span>
                        <span className="text-sm text-mac-blue-600 font-medium">{group.project_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-mac-gray-500">
                        <span>{group.milestones.length} hitos</span>
                        <span className="text-mac-gray-300">|</span>
                        <span>Pagado: {formatAmount(group.total_paid)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-mac-gray-500 mb-1">Pendiente</p>
                        <p className="text-lg font-semibold text-amber-600">
                          {formatAmount(group.total_pending)}
                        </p>
                      </div>

                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-mac-gray-500">Avance</span>
                          <span className="font-medium text-emerald-600">{group.percentage_paid.toFixed(0)}%</span>
                        </div>
                        <div className="mac-progress-bar">
                          <div
                            className="mac-progress-bar-fill bg-emerald-500"
                            style={{ width: `${Math.min(group.percentage_paid, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-mac-gray-50 border-t border-mac-gray-100">
                      <div className="p-5">
                        <div className="bg-white rounded-xl border border-mac-gray-200 overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-mac-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-mac-gray-500 uppercase tracking-wide">Hito</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-mac-gray-500 uppercase tracking-wide">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    Fecha
                                  </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-mac-gray-500 uppercase tracking-wide">Monto</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-mac-gray-500 uppercase tracking-wide">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSortByStatus();
                                    }}
                                    className="flex items-center justify-center gap-1 hover:text-mac-gray-700 transition mx-auto"
                                  >
                                    Estado
                                    {sortByStatus === null && <ArrowUpDown size={12} />}
                                    {sortByStatus === 'asc' && <ArrowUp size={12} />}
                                    {sortByStatus === 'desc' && <ArrowDown size={12} />}
                                  </button>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-mac-gray-500 uppercase tracking-wide">Comprobante</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-mac-gray-100">
                              {group.milestones.map((milestone) => (
                                <tr key={milestone.milestone_id} className="hover:bg-mac-blue-50/30 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <CircleDot size={14} className={
                                        milestone.status === 'Pagado' ? 'text-emerald-500' :
                                        milestone.status === 'Cumplido' ? 'text-amber-500' : 'text-mac-gray-400'
                                      } />
                                      <span className="text-sm font-medium text-mac-gray-900">{milestone.milestone_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-mac-gray-600">
                                    {new Date(milestone.planned_date).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-semibold text-mac-gray-900">
                                      {formatAmount(milestone.amount)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <select
                                      value={milestone.status}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => handleStatusChange(milestone.milestone_id, e.target.value)}
                                      className={`text-xs font-medium rounded-full px-3 py-1.5 border-0 cursor-pointer transition-colors ${
                                        milestone.status === 'Pagado'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : milestone.status === 'Cumplido'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-mac-gray-100 text-mac-gray-700'
                                      }`}
                                    >
                                      <option value="Pendiente">Pendiente</option>
                                      <option value="Cumplido">Cumplido</option>
                                      <option value="Pagado">Pagado</option>
                                    </select>
                                    {milestone.status === 'Pagado' && milestone.paid_date && (
                                      <p className="text-[10px] text-mac-gray-400 mt-1">
                                        {new Date(milestone.paid_date).toLocaleDateString('es-ES')}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {milestone.status === 'Pagado' && (
                                      <>
                                        {milestone.payment_receipt_url ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <a
                                              href={milestone.payment_receipt_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="p-1.5 text-mac-blue-500 hover:bg-mac-blue-50 rounded-lg transition"
                                              title="Ver comprobante"
                                            >
                                              <Eye size={16} />
                                            </a>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadReceiptModal({
                                                  isOpen: true,
                                                  milestoneId: milestone.milestone_id,
                                                  milestoneName: milestone.milestone_name,
                                                });
                                              }}
                                              className="p-1.5 text-mac-gray-400 hover:text-mac-blue-500 hover:bg-mac-blue-50 rounded-lg transition"
                                              title="Actualizar"
                                            >
                                              <Upload size={16} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setUploadReceiptModal({
                                                isOpen: true,
                                                milestoneId: milestone.milestone_id,
                                                milestoneName: milestone.milestone_name,
                                              });
                                            }}
                                            className="px-3 py-1.5 text-xs bg-mac-blue-500 text-white rounded-lg hover:bg-mac-blue-600 transition flex items-center gap-1.5 mx-auto font-medium"
                                          >
                                            <Upload size={12} />
                                            Subir
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-mac-gray-50 border-t border-mac-gray-200">
                              <tr>
                                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-mac-gray-700">
                                  Total del Proveedor
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-mac-gray-900">
                                  {formatAmount(group.total_committed)}
                                </td>
                                <td colSpan={2} className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-3 text-xs">
                                    <span className="text-emerald-600 font-medium">
                                      Pagado: {formatAmount(group.total_paid)}
                                    </span>
                                    <span className="text-mac-gray-300">|</span>
                                    <span className="text-amber-600 font-medium">
                                      Pendiente: {formatAmount(group.total_pending)}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProject === 'all' && supplierDebts.length > 0 && (
        <div className="mac-card">
          <div className="p-4 border-b border-mac-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-mac-gray-900">Deuda por Proveedor</h2>
              <p className="text-xs text-mac-gray-500">Resumen de pagos pendientes</p>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supplierDebts.slice(0, 6).map((supplier) => (
                <div
                  key={supplier.supplier_id}
                  className="p-4 rounded-xl border border-mac-gray-200 bg-white hover:shadow-mac transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-mac-gray-900 text-sm">{supplier.supplier_name}</p>
                      <p className="text-xs text-mac-gray-500">{supplier.milestone_count} hitos</p>
                    </div>
                    <span className="text-lg font-semibold text-amber-600">
                      {formatAmount(supplier.total_pending)}
                    </span>
                  </div>
                  <div className="mac-progress-bar">
                    <div
                      className="mac-progress-bar-fill bg-emerald-500"
                      style={{ width: `${Math.min(supplier.percentage_paid, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-mac-gray-500">
                    <span>Pagado: {supplier.percentage_paid.toFixed(0)}%</span>
                    <span>Total: {formatAmount(supplier.total_committed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <UploadPaymentReceiptModal
        isOpen={uploadReceiptModal.isOpen}
        onClose={() =>
          setUploadReceiptModal({
            isOpen: false,
            milestoneId: '',
            milestoneName: '',
          })
        }
        milestoneId={uploadReceiptModal.milestoneId}
        milestoneName={uploadReceiptModal.milestoneName}
        onSuccess={() => {
          loadPendingMilestones();
        }}
      />
    </div>
  );
}
