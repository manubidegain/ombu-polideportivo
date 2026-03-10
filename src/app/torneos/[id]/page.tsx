import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { RegistrationForm } from './RegistrationForm';

export default async function TournamentPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        courts (name)
      )
    `
    )
    .eq('id', id)
    .neq('status', 'cancelled')
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Check if tournament is open for registration
  const isRegistrationOpen = tournament.status === 'registration_open';
  const registrationDeadlinePassed =
    tournament.registration_deadline &&
    new Date(tournament.registration_deadline) < new Date();

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

  const getStatusMessage = () => {
    if (tournament.status === 'draft') {
      return {
        message: 'Este torneo aún no está abierto para inscripciones',
        color: 'text-yellow-400',
      };
    }
    if (tournament.status === 'completed') {
      return {
        message: 'Este torneo ya finalizó',
        color: 'text-gray-400',
      };
    }
    if (tournament.status === 'in_progress') {
      return {
        message: 'Este torneo está en curso',
        color: 'text-blue-400',
      };
    }
    if (registrationDeadlinePassed) {
      return {
        message: 'El plazo de inscripción ha finalizado',
        color: 'text-red-400',
      };
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-[#ededed]">
      {/* Hero Section */}
      <div className="relative bg-[#1b1b1b] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link
            href="/torneos"
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-6"
          >
            ← Volver a torneos
          </Link>
          <h1 className="font-heading text-[48px] md:text-[64px] text-white mb-4 uppercase">
            {tournament.name}
          </h1>
          {tournament.description && (
            <p className="font-body text-[18px] text-gray-300 mb-6">{tournament.description}</p>
          )}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white">
            <div>
              <p className="font-body text-[14px] text-gray-400 mb-1">Fecha de Inicio</p>
              <p className="font-heading text-[24px]">
                {format(new Date(tournament.start_date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="font-body text-[14px] text-gray-400 mb-1">Deporte</p>
              <p className="font-heading text-[24px] capitalize">{tournament.sport_type}</p>
            </div>
            <div>
              <p className="font-body text-[14px] text-gray-400 mb-1">Inscripción</p>
              <p className="font-heading text-[24px]">${tournament.registration_price}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tournament Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Categories */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-[28px] text-[#1b1b1b] mb-6">CATEGORÍAS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriesWithCounts.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-heading text-[20px] text-[#1b1b1b] mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="font-body text-[14px] text-gray-600 mb-3">
                        {category.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inscriptos:</span>
                        <span
                          className={`font-semibold ${
                            category.registrations_count >= category.max_teams
                              ? 'text-red-600'
                              : category.registrations_count >= (category.min_teams ?? 0)
                                ? 'text-green-600'
                                : 'text-yellow-600'
                          }`}
                        >
                          {category.registrations_count} / {category.max_teams}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mínimo requerido:</span>
                        <span className="font-semibold">{category.min_teams ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournament Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-heading text-[28px] text-[#1b1b1b] mb-6">
                DETALLES DEL TORNEO
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-[14px] text-gray-600 mb-1">Sets para ganar</p>
                    <p className="font-body text-[18px] text-[#1b1b1b] font-semibold">
                      {tournament.sets_to_win}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-[14px] text-gray-600 mb-1">Games por set</p>
                    <p className="font-body text-[18px] text-[#1b1b1b] font-semibold">
                      {tournament.games_per_set}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-[14px] text-gray-600 mb-1">Puntos tiebreak</p>
                    <p className="font-body text-[18px] text-[#1b1b1b] font-semibold">
                      {tournament.tiebreak_points}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-[14px] text-gray-600 mb-1">Duración partido</p>
                    <p className="font-body text-[18px] text-[#1b1b1b] font-semibold">
                      {tournament.match_duration_minutes} min
                    </p>
                  </div>
                </div>
                {tournament.registration_deadline && (
                  <div className="pt-4 border-t">
                    <p className="font-body text-[14px] text-gray-600 mb-1">
                      Cierre de inscripciones
                    </p>
                    <p className="font-body text-[18px] text-[#1b1b1b] font-semibold">
                      {format(
                        new Date(tournament.registration_deadline),
                        "d 'de' MMMM, yyyy 'a las' HH:mm",
                        { locale: es }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h2 className="font-heading text-[28px] text-[#1b1b1b] mb-6">INSCRIBIRSE</h2>

              {statusMessage ? (
                <div className="text-center py-8">
                  <p className={`font-body text-[16px] ${statusMessage.color}`}>
                    {statusMessage.message}
                  </p>
                </div>
              ) : (
                <RegistrationForm
                  tournamentId={tournament.id}
                  categories={categoriesWithCounts}
                  sportType={tournament.sport_type as 'padel' | 'futbol'}
                  timeSlots={tournament.tournament_time_slots || []}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
