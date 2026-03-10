import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TournamentStatusBadge } from '../TournamentStatusBadge';
import { TournamentActions } from './TournamentActions';
import { CategoryManager } from './CategoryManager';
import { TimeSlotManager } from './TimeSlotManager';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function TournamentDetailPage({
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

  // Fetch tournament with categories and time slots
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      tournament_categories (
        id,
        name,
        description,
        max_teams,
        min_teams
      ),
      tournament_time_slots (
        id,
        day_of_week,
        start_time,
        end_time,
        is_active,
        court_id,
        courts (name)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Fetch available courts
  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  // Fetch registration counts by category
  const categoriesWithCounts = await Promise.all(
    (tournament.tournament_categories || []).map(async (category) => {
      const { count } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('status', 'confirmed');

      return { ...category, registrations_count: count || 0 };
    })
  );

  // Fetch total registrations
  const { count: totalRegistrations } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)
    .eq('status', 'confirmed');

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/torneos"
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver a torneos
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-[48px] text-white mb-2">{tournament.name}</h1>
              {tournament.description && (
                <p className="font-body text-[16px] text-gray-400">{tournament.description}</p>
              )}
            </div>
            <TournamentStatusBadge status={tournament.status} />
          </div>
        </div>

        {/* Actions */}
        <TournamentActions tournament={tournament} />

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tournament Configuration */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="font-heading text-[24px] text-white mb-6">CONFIGURACIÓN</h2>
            <div className="space-y-4">
              <div>
                <p className="font-body text-[12px] text-gray-400">Deporte</p>
                <p className="font-body text-[16px] text-white capitalize">{tournament.sport_type}</p>
              </div>
              <div>
                <p className="font-body text-[12px] text-gray-400">Precio de inscripción</p>
                <p className="font-body text-[16px] text-white">${tournament.registration_price}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-[12px] text-gray-400">Sets para ganar</p>
                  <p className="font-body text-[16px] text-white">{tournament.sets_to_win}</p>
                </div>
                <div>
                  <p className="font-body text-[12px] text-gray-400">Games por set</p>
                  <p className="font-body text-[16px] text-white">{tournament.games_per_set}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-[12px] text-gray-400">Puntos tiebreak</p>
                  <p className="font-body text-[16px] text-white">{tournament.tiebreak_points}</p>
                </div>
                <div>
                  <p className="font-body text-[12px] text-gray-400">Duración partido</p>
                  <p className="font-body text-[16px] text-white">{tournament.match_duration_minutes} min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="font-heading text-[24px] text-white mb-6">FECHAS</h2>
            <div className="space-y-4">
              <div>
                <p className="font-body text-[12px] text-gray-400">Fecha de inicio</p>
                <p className="font-body text-[16px] text-white">
                  {format(new Date(tournament.start_date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              {tournament.end_date && (
                <div>
                  <p className="font-body text-[12px] text-gray-400">Fecha de fin</p>
                  <p className="font-body text-[16px] text-white">
                    {format(new Date(tournament.end_date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
              {tournament.registration_deadline && (
                <div>
                  <p className="font-body text-[12px] text-gray-400">Cierre de inscripciones</p>
                  <p className="font-body text-[16px] text-white">
                    {format(
                      new Date(tournament.registration_deadline),
                      "EEEE d 'de' MMMM yyyy 'a las' HH:mm",
                      { locale: es }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <CategoryManager tournamentId={id} categories={categoriesWithCounts} />
        </div>

        {/* Time Slots */}
        <div className="mb-8">
          <TimeSlotManager
            tournamentId={id}
            timeSlots={tournament.tournament_time_slots || []}
            courts={courts || []}
          />
        </div>

        {/* Registrations Summary */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[24px] text-white">INSCRIPCIONES</h2>
            <span className="font-heading text-[32px] text-[#dbf228]">{totalRegistrations || 0}</span>
          </div>
          <Link
            href={`/admin/torneos/${id}/inscripciones`}
            className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-2 px-6 rounded hover:bg-[#c5db23] transition-colors"
          >
            VER INSCRIPCIONES
          </Link>
        </div>
      </div>
    </div>
  );
}
