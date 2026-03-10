import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function TournamentRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createServerClient();

  // Fetch tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, sport_type')
    .eq('id', id)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Fetch registrations with related data
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select(
      `
      *,
      tournament_categories (
        id,
        name
      )
    `
    )
    .eq('tournament_id', id)
    .order('registered_at', { ascending: false });

  // Group registrations by status
  const confirmed = registrations?.filter((r) => r.status === 'confirmed') || [];
  const pending = registrations?.filter((r) => r.status === 'pending') || [];
  const cancelled = registrations?.filter((r) => r.status === 'cancelled') || [];

  const getStatusBadge = (status: string | null) => {
    const badges = {
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    const labels = {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
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
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver al torneo
          </Link>
          <h1 className="font-heading text-[48px] text-white mb-2">INSCRIPCIONES</h1>
          <p className="font-body text-[16px] text-gray-400">{tournament.name}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Confirmadas</p>
                <p className="font-heading text-[32px] text-green-400">{confirmed.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Pendientes</p>
                <p className="font-heading text-[32px] text-yellow-400">{pending.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Canceladas</p>
                <p className="font-heading text-[32px] text-red-400">{cancelled.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="font-heading text-[24px] text-white mb-6">
            TODAS LAS INSCRIPCIONES ({registrations?.length || 0})
          </h2>

          {registrations && registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">EQUIPO</th>
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">CATEGORÍA</th>
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">JUGADORES</th>
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">CONTACTO</th>
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">FECHA</th>
                    <th className="text-left font-body text-[12px] text-gray-400 pb-3">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-white/5">
                      <td className="py-4">
                        <p className="font-body text-[14px] text-white">{registration.team_name}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-body text-[14px] text-white">
                          {registration.tournament_categories?.name || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          {registration.player_names && Array.isArray(registration.player_names) && registration.player_names.length > 0 ? (
                            registration.player_names.map((player, idx) => (
                              <p key={idx} className="font-body text-[12px] text-gray-400">
                                {String(player)}
                              </p>
                            ))
                          ) : (
                            <p className="font-body text-[12px] text-gray-400">No especificado</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-body text-[12px] text-white">
                          {registration.contact_email}
                        </p>
                        {registration.contact_phone && (
                          <p className="font-body text-[11px] text-gray-400">
                            {registration.contact_phone}
                          </p>
                        )}
                      </td>
                      <td className="py-4">
                        <p className="font-body text-[12px] text-gray-400">
                          {registration.registered_at ? format(new Date(registration.registered_at), "d MMM yyyy", { locale: es }) : 'N/A'}
                        </p>
                      </td>
                      <td className="py-4">{getStatusBadge(registration.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="font-body text-[16px] text-gray-400">
                No hay inscripciones todavía
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
