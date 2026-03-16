import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/server';
import { getMatchAssignmentHTML } from '@/lib/email/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

type Match = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  team1_id: string;
  team2_id: string;
  tournament_id: string;
  series_id?: string;
  court_id?: string;
};

/**
 * Send match assignment notification to all players in a match
 */
export async function sendMatchAssignmentNotification(matchId: string) {
  const supabase = await createServerClient();

  // Fetch match with all details
  const { data: match, error: matchError } = await supabase
    .from('tournament_matches')
    .select(
      `
      *,
      tournament:tournaments!tournament_matches_tournament_id_fkey (
        name
      ),
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        id,
        team_name,
        player1_id,
        player2_id,
        contact_email
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        id,
        team_name,
        player1_id,
        player2_id,
        contact_email
      ),
      court:courts (
        name
      ),
      series:tournament_series (
        name
      )
    `
    )
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    console.error('Error fetching match:', matchError);
    throw new Error('No se pudo encontrar el partido');
  }

  // Get player details for team1
  const { data: team1Players } = await supabase.auth.admin.listUsers();
  const team1Player1 = team1Players?.users.find((u) => u.id === match.team1.player1_id);
  const team1Player2 = match.team1.player2_id
    ? team1Players?.users.find((u) => u.id === match.team1.player2_id)
    : null;

  // Get player details for team2
  const team2Player1 = team1Players?.users.find((u) => u.id === match.team2.player1_id);
  const team2Player2 = match.team2.player2_id
    ? team1Players?.users.find((u) => u.id === match.team2.player2_id)
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://polideportivoombu.com';
  const matchUrl = `${baseUrl}/mis-torneos`;

  // Send email to team1 player1
  if (team1Player1) {
    await sendMatchEmail({
      playerEmail: team1Player1.email || '',
      playerName: team1Player1.user_metadata?.full_name || team1Player1.email || 'Jugador',
      tournamentName: match.tournament.name,
      teamName: match.team1.team_name || 'Tu equipo',
      opponentName: match.team2.team_name || 'Equipo rival',
      date: match.scheduled_date || '',
      time: match.scheduled_time?.slice(0, 5) || '',
      courtName: match.court?.name || 'Por definir',
      seriesName: match.series?.name,
      matchUrl,
    });
  }

  // Send email to team1 player2 (if exists)
  if (team1Player2) {
    await sendMatchEmail({
      playerEmail: team1Player2.email || '',
      playerName: team1Player2.user_metadata?.full_name || team1Player2.email || 'Jugador',
      tournamentName: match.tournament.name,
      teamName: match.team1.team_name || 'Tu equipo',
      opponentName: match.team2.team_name || 'Equipo rival',
      date: match.scheduled_date || '',
      time: match.scheduled_time?.slice(0, 5) || '',
      courtName: match.court?.name || 'Por definir',
      seriesName: match.series?.name,
      matchUrl,
    });
  }

  // Send email to team2 player1
  if (team2Player1) {
    await sendMatchEmail({
      playerEmail: team2Player1.email || '',
      playerName: team2Player1.user_metadata?.full_name || team2Player1.email || 'Jugador',
      tournamentName: match.tournament.name,
      teamName: match.team2.team_name || 'Tu equipo',
      opponentName: match.team1.team_name || 'Equipo rival',
      date: match.scheduled_date || '',
      time: match.scheduled_time?.slice(0, 5) || '',
      courtName: match.court?.name || 'Por definir',
      seriesName: match.series?.name,
      matchUrl,
    });
  }

  // Send email to team2 player2 (if exists)
  if (team2Player2) {
    await sendMatchEmail({
      playerEmail: team2Player2.email || '',
      playerName: team2Player2.user_metadata?.full_name || team2Player2.email || 'Jugador',
      tournamentName: match.tournament.name,
      teamName: match.team2.team_name || 'Tu equipo',
      opponentName: match.team1.team_name || 'Equipo rival',
      date: match.scheduled_date || '',
      time: match.scheduled_time?.slice(0, 5) || '',
      courtName: match.court?.name || 'Por definir',
      seriesName: match.series?.name,
      matchUrl,
    });
  }
}

/**
 * Send match assignment email to a single player
 */
async function sendMatchEmail(data: {
  playerEmail: string;
  playerName: string;
  tournamentName: string;
  teamName: string;
  opponentName: string;
  date: string;
  time: string;
  courtName: string;
  seriesName?: string;
  matchUrl: string;
}) {
  try {
    await resend.emails.send({
      from: 'Polideportivo Ombú <info@ombustudio.com>',
      to: data.playerEmail,
      replyTo: 'polideportivocentrounion@gmail.com',
      subject: `Partido asignado - ${data.tournamentName}`,
      html: getMatchAssignmentHTML(data),
    });
  } catch (error) {
    console.error('Error sending match email:', error);
    // Don't throw - we want to continue sending to other players even if one fails
  }
}

/**
 * Send match assignment notifications for multiple matches at once
 * Useful when generating fixtures in bulk
 */
export async function sendBulkMatchNotifications(matchIds: string[]) {
  const results = await Promise.allSettled(
    matchIds.map((id) => sendMatchAssignmentNotification(id))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed, total: matchIds.length };
}
