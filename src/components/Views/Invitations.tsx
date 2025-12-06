import { useEffect, useState } from 'react';
import { Mail, Check, X, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface Invitation {
  id: string;
  project_id: string;
  owner_id: string;
  email_invited: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  project: {
    client: string;
    name: string;
    location: string;
  };
  owner: {
    email: string;
    full_name: string;
  };
}

export function Invitations() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data: received, error: receivedError } = await supabase
        .from('shared_project_requests')
        .select(`
          *,
          project:projects(client, name, location),
          owner:user_profiles!owner_id(email, full_name)
        `)
        .eq('invited_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const { data: sent, error: sentError } = await supabase
        .from('shared_project_requests')
        .select(`
          *,
          project:projects(client, name, location),
          invited:user_profiles!invited_user_id(email, full_name)
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      setReceivedInvitations(received || []);
      setSentInvitations(sent || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      showToast('Error al cargar invitaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_project_invitation', {
        p_invitation_id: invitationId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        showToast(result.error || 'Error al aceptar invitación', 'error');
        return;
      }

      showToast('Invitación aceptada exitosamente', 'success');
      loadInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast('Error al aceptar la invitación', 'error');
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_project_invitation', {
        p_invitation_id: invitationId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        showToast(result.error || 'Error al rechazar invitación', 'error');
        return;
      }

      showToast('Invitación rechazada', 'success');
      loadInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      showToast('Error al rechazar la invitación', 'error');
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('cancel_project_invitation', {
        p_invitation_id: invitationId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        showToast(result.error || 'Error al cancelar invitación', 'error');
        return;
      }

      showToast('Invitación cancelada', 'success');
      loadInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      showToast('Error al cancelar la invitación', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-amber-100 text-amber-800', text: 'Pendiente' },
      accepted: { color: 'bg-green-100 text-green-800', text: 'Aceptada' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rechazada' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelada' }
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="mt-2 text-gray-600">Cargando invitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="apple-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Mail size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Invitaciones de Proyectos</h2>
            <p className="text-sm text-gray-600">Gestiona las invitaciones enviadas y recibidas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'received'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Recibidas ({receivedInvitations.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'sent'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Enviadas ({sentInvitations.filter(i => i.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tienes invitaciones</p>
              </div>
            ) : (
              receivedInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="apple-card p-5 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-lg mb-1">
                            {invitation.project?.client || 'Proyecto sin nombre'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <User size={14} />
                            <span>Invitado por: {invitation.owner?.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>{formatDate(invitation.created_at)}</span>
                          </div>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                    </div>

                    {invitation.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invitation.id)}
                          className="apple-button-secondary flex items-center gap-2 text-sm"
                        >
                          <Check size={16} />
                          <span>Aceptar</span>
                        </button>
                        <button
                          onClick={() => handleReject(invitation.id)}
                          className="apple-button-ghost flex items-center gap-2 text-sm"
                        >
                          <X size={16} />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentInvitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No has enviado invitaciones</p>
              </div>
            ) : (
              sentInvitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="apple-card p-5 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-lg mb-1">
                            {invitation.project?.client || 'Proyecto sin nombre'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Mail size={14} />
                            <span>Invitado: {invitation.email_invited}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={12} />
                            <span>{formatDate(invitation.created_at)}</span>
                          </div>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                    </div>

                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        className="apple-button-ghost flex items-center gap-2 text-sm"
                      >
                        <X size={16} />
                        <span>Cancelar</span>
                      </button>
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
