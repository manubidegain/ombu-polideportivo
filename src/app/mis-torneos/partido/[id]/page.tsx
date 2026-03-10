import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { ResultEntry } from '@/components/tournaments/ResultEntry';

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login?redirect=/mis-torneos');
  }

  const supabase = await createServerClient();

  // Fetch match with full details
  const { data: match, error } = await supabase
    .from('tournament_matches')
    .select(
      `
      *,
      tournament:tournaments!tournament_matches_tournament_id_fkey (
        id,
        name,
        sport_type,
        sets_to_win,
        games_per_set,
        tiebreak_points
      ),
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        id,
        team_name,
        player_names,
        player1_id,
        player2_id
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        id,
        team_name,
        player_names,
        player1_id,
        player2_id
      ),
      court:courts (
        name
      ),
      series:tournament_series (
        id,
        name,
        phase
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !match) {
    notFound();
  }

  // Check if user is part of this match
  const isUserInMatch =
    match.team1.player1_id === user.id ||
    match.team1.player2_id === user.id ||
    match.team2.player1_id === user.id ||
    match.team2.player2_id === user.id;

  if (!isUserInMatch) {
    redirect('/mis-torneos');
  }

  // Check if match can be edited (must be today and scheduled)
  const today = new Date().toISOString().split('T')[0];
  const canEditResult =
    match.status === 'scheduled' && match.scheduled_date === today;

  // If match is already completed, show result
  if (match.status === 'completed') {
    return (
      <div className="min-h-screen bg-[#ededed]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/mis-torneos"
            className="inline-flex items-center font-body text-[14px] text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Volver a Mis Torneos
          </Link>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="font-heading text-[32px] text-[#1b1b1b] mb-2">
                RESULTADO FINAL
              </h1>
              <p className="font-body text-[16px] text-gray-600">
                {match.tournament.name}
              </p>
            </div>

            {/* Match Info */}
            <div className="flex justify-center gap-6 mb-8 text-gray-600">
              {match.scheduled_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-body text-[14px]">
                    {format(new Date(match.scheduled_date), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
              {match.scheduled_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-body text-[14px]">
                    {match.scheduled_time.slice(0, 5)}
                  </span>
                </div>
              )}
              {match.court && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-body text-[14px]">{match.court.name}</span>
                </div>
              )}
            </div>

            {/* Score Display */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="space-y-4">
                {/* Team 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-heading text-[20px] text-[#1b1b1b]">
                      {match.team1.team_name}
                    </p>
                    <p className="font-body text-[12px] text-gray-600">
                      {Array.isArray(match.team1.player_names)
                        ? (match.team1.player_names as string[]).join(', ')
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {(match.score as any)?.sets?.map((set: any, idx: number) => (
                      <span
                        key={idx}
                        className="font-heading text-[24px] text-[#1b1b1b] w-8 text-center"
                      >
                        {set.team1}
                      </span>
                    ))}
                  </div>
                  {match.winner_id === match.team1.id && (
                    <span className="ml-4 font-heading text-[16px] text-[#dbf228]">
                      GANADOR
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-200" />

                {/* Team 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-heading text-[20px] text-[#1b1b1b]">
                      {match.team2.team_name}
                    </p>
                    <p className="font-body text-[12px] text-gray-600">
                      {Array.isArray(match.team2.player_names)
                        ? (match.team2.player_names as string[]).join(', ')
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {(match.score as any)?.sets?.map((set: any, idx: number) => (
                      <span
                        key={idx}
                        className="font-heading text-[24px] text-[#1b1b1b] w-8 text-center"
                      >
                        {set.team2}
                      </span>
                    ))}
                  </div>
                  {match.winner_id === match.team2.id && (
                    <span className="ml-4 font-heading text-[16px] text-[#dbf228]">
                      GANADOR
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/mis-torneos"
              className="block text-center bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-4 rounded hover:bg-[#2b2b2b] transition-colors"
            >
              VOLVER A MIS TORNEOS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If match cannot be edited yet
  if (!canEditResult) {
    return (
      <div className="min-h-screen bg-[#ededed]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/mis-torneos"
            className="inline-flex items-center font-body text-[14px] text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Volver a Mis Torneos
          </Link>

          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <h1 className="font-heading text-[32px] text-[#1b1b1b] mb-4">
              PARTIDO PROGRAMADO
            </h1>

            <div className="bg-blue-500/10 border border-blue-500 rounded-md p-6 mb-6">
              <p className="font-body text-[16px] text-blue-600">
                Solo puedes cargar el resultado el día del partido
              </p>
            </div>

            {/* Match Details */}
            <div className="text-left space-y-4">
              <div>
                <p className="font-body text-[12px] text-gray-600">Torneo</p>
                <p className="font-heading text-[18px] text-[#1b1b1b]">
                  {match.tournament.name}
                </p>
              </div>

              <div className="flex gap-4">
                {match.scheduled_date && (
                  <div>
                    <p className="font-body text-[12px] text-gray-600">Fecha</p>
                    <p className="font-body text-[16px] text-[#1b1b1b]">
                      {format(new Date(match.scheduled_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                )}
                {match.scheduled_time && (
                  <div>
                    <p className="font-body text-[12px] text-gray-600">Hora</p>
                    <p className="font-body text-[16px] text-[#1b1b1b]">
                      {match.scheduled_time.slice(0, 5)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-600">Partidos</p>
                <p className="font-heading text-[16px] text-[#1b1b1b]">
                  {match.team1.team_name} vs {match.team2.team_name}
                </p>
              </div>
            </div>

            <Link
              href="/mis-torneos"
              className="mt-8 block bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-4 rounded hover:bg-[#2b2b2b] transition-colors"
            >
              VOLVER A MIS TORNEOS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show result entry form
  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/mis-torneos"
          className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
        >
          ← Volver a Mis Torneos
        </Link>

        <div className="mb-8">
          <h1 className="font-heading text-[32px] text-white mb-2">CARGAR RESULTADO</h1>
          <p className="font-body text-[16px] text-gray-400">{match.tournament.name}</p>
        </div>

        {/* Match Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-heading text-[20px] text-white mb-1">
                {match.team1.team_name}
              </p>
              <p className="font-body text-[14px] text-gray-400">
                {Array.isArray(match.team1.player_names)
                  ? (match.team1.player_names as string[]).join(', ')
                  : ''}
              </p>
            </div>
            <span className="font-body text-[16px] text-gray-400">vs</span>
            <div className="text-right">
              <p className="font-heading text-[20px] text-white mb-1">
                {match.team2.team_name}
              </p>
              <p className="font-body text-[14px] text-gray-400">
                {Array.isArray(match.team2.player_names)
                  ? (match.team2.player_names as string[]).join(', ')
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-gray-400 border-t border-white/10 pt-4">
            {match.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-body text-[14px]">
                  {format(new Date(match.scheduled_date), "d MMM yyyy", { locale: es })}
                </span>
              </div>
            )}
            {match.scheduled_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-body text-[14px]">
                  {match.scheduled_time.slice(0, 5)}
                </span>
              </div>
            )}
            {match.court && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-body text-[14px]">{match.court.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Result Entry Form */}
        <ResultEntry
          matchId={match.id}
          team1Name={match.team1.team_name || 'Equipo 1'}
          team2Name={match.team2.team_name || 'Equipo 2'}
          team1Id={match.team1.id}
          team2Id={match.team2.id}
          setsToWin={match.tournament.sets_to_win}
          gamesPerSet={match.tournament.games_per_set}
          tiebreakPoints={match.tournament.tiebreak_points}
          seriesId={match.series?.id}
        />
      </div>
    </div>
  );
}
