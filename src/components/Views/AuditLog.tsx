import { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  user_email: string;
  action_type: string;
  entity_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

export function AuditLog() {
  const { userProfile } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadAuditLogs();

      const subscription = supabase
        .channel('audit_logs_changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            setLogs((prev) => [payload.new as AuditLogEntry, ...prev]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userProfile]);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const getActionBadge = (action: string) => {
    const badges = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      upload: 'bg-purple-100 text-purple-800',
      download: 'bg-yellow-100 text-yellow-800',
    };
    return badges[action as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels = {
      create: 'Creó',
      update: 'Actualizó',
      delete: 'Eliminó',
      view: 'Visualizó',
      upload: 'Subió',
      download: 'Descargó',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = filterType === 'all'
    ? logs
    : logs.filter((log) => log.action_type === filterType);

  if (userProfile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No tienes permisos para ver el registro de auditoría.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-slate-800" size={32} />
          <h1 className="text-3xl font-bold text-slate-800">Registro de Auditoría</h1>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todas las acciones</option>
            <option value="create">Creaciones</option>
            <option value="update">Actualizaciones</option>
            <option value="upload">Subidas</option>
            <option value="delete">Eliminaciones</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay registros de auditoría
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 transition flex items-start gap-4"
                >
                  <div className="flex-shrink-0 mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${getActionBadge(log.action_type)}`}
                    >
                      {getActionLabel(log.action_type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user_email}</span>{' '}
                      {log.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.entity_type} • {formatDate(log.created_at)}
                    </p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          Ver detalles
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
