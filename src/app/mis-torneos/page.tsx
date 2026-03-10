import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default async function MyTournamentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/mis-torneos');
  }

  const supabase = await createServerClient();
  const userEmail = user.email || '';

  // Fetch invitations sent by this user
  const { data: sentInvitations } = await supabase
    .from('tournament_invitations')
    .select(
      `
      *,
      tournaments (
        id,
        name,
        start_date,
        sport_type
      ),
      tournament_categories (
        id,
        name
      )
    `
    )
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch invitations received by this user
  const { data: receivedInvitations } = await supabase
    .from('tournament_invitations')
    .select(
      `
      *,
      tournaments (
        id,
        name,
        start_date,
        sport_type
      ),
      tournament_categories (
        id,
        name
      )
    `
    )
    .eq('invitee_email', userEmail)
    .order('created_at', { ascending: false });

  // Fetch confirmed registrations where user is a player
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select(
      `
      *,
      tournaments (
        id,
        name,
        start_date,
        sport_type,
        status
      ),
      tournament_categories (
        id,
        name
      )
    `
    )
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const getStatusBadge = (status: string | null) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-600',
      accepted: 'bg-green-500/20 text-green-600',
      rejected: 'bg-red-500/20 text-red-600',
      expired: 'bg-gray-500/20 text-gray-600',
      confirmed: 'bg-green-500/20 text-green-600',
      cancelled: 'bg-red-500/20 text-red-600',
    };
    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      expired: 'Expirada',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
    };
    const statusKey = (status || 'pending') as keyof typeof badges;
    return (
      <span className={`px-2 py-1 rounded font-body text-[12px] ${badges[statusKey]}`}>
        {labels[statusKey]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#ededed]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-[48px] text-[#1b1b1b] mb-2">MIS TORNEOS</h1>
          <p className="font-body text-[16px] text-gray-600">
            Invitaciones y equipos registrados
          </p>
        </div>

        {/* Invitations Sent */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-heading text-[24px] text-[#1b1b1b] mb-4">
            INVITACIONES ENVIADAS ({sentInvitations?.length || 0})
          </h2>

          {sentInvitations && sentInvitations.length > 0 ? (
            <div className="space-y-3">
              {sentInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-heading text-[18px] text-[#1b1b1b]">
                      {invitation.team_name}
                    </p>
                    <p className="font-body text-[14px] text-gray-600">
                      {invitation.tournaments?.name} - {invitation.tournament_categories?.name}
                    </p>
                    <p className="font-body text-[12px] text-gray-500">
                      Invitado: {invitation.invitee_email}
                    </p>
                    {invitation.created_at && (
                      <p className="font-body text-[11px] text-gray-400">
                        {format(new Date(invitation.created_at), "d MMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(invitation.status)}
                    {invitation.status === 'pending' && (
                      <p className="font-body text-[11px] text-gray-500 mt-1">
                        Esperando respuesta
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              No has enviado invitaciones todavía
            </p>
          )}
        </div>

        {/* Invitations Received */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-heading text-[24px] text-[#1b1b1b] mb-4">
            INVITACIONES RECIBIDAS ({receivedInvitations?.length || 0})
          </h2>

          {receivedInvitations && receivedInvitations.length > 0 ? (
            <div className="space-y-3">
              {receivedInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-heading text-[18px] text-[#1b1b1b]">
                      {invitation.team_name}
                    </p>
                    <p className="font-body text-[14px] text-gray-600">
                      {invitation.tournaments?.name} - {invitation.tournament_categories?.name}
                    </p>
                    <p className="font-body text-[12px] text-gray-500">
                      De: {invitation.inviter_email}
                    </p>
                    {invitation.created_at && (
                      <p className="font-body text-[11px] text-gray-400">
                        {format(new Date(invitation.created_at), "d MMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(invitation.status)}
                    {invitation.status === 'pending' && (
                      <Link
                        href={`/torneos/invitacion/${invitation.id}`}
                        className="block bg-[#1b1b1b] text-white font-body text-[12px] py-2 px-4 rounded hover:bg-[#2b2b2b] transition-colors"
                      >
                        Responder
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              No tienes invitaciones pendientes
            </p>
          )}
        </div>

        {/* Confirmed Registrations */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-heading text-[24px] text-[#1b1b1b] mb-4">
            EQUIPOS REGISTRADOS ({registrations?.length || 0})
          </h2>

          {registrations && registrations.length > 0 ? (
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-heading text-[18px] text-[#1b1b1b]">
                      {registration.team_name}
                    </p>
                    <p className="font-body text-[14px] text-gray-600">
                      {registration.tournaments?.name} - {registration.tournament_categories?.name}
                    </p>
                    <p className="font-body text-[12px] text-gray-500">
                      {registration.tournaments?.sport_type === 'padel' ? 'Pádel' : 'Fútbol'}
                    </p>
                    {registration.tournaments?.start_date && (
                      <p className="font-body text-[11px] text-gray-400">
                        Inicia:{' '}
                        {format(new Date(registration.tournaments.start_date), "d MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(registration.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              No tienes equipos registrados todavía
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
