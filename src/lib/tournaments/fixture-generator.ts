import { createServerClient } from '@/lib/supabase/server';

type Team = {
  id: string;
  team_name: string;
};

type TimeSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  court_id: string;
};

type Match = {
  tournament_id: string;
  series_id: string;
  team1_id: string;
  team2_id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  court_id: string | null;
  status: 'scheduled';
};

type TeamUnavailability = {
  registration_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

/**
 * Generate round-robin matches for a group of teams
 * Each team plays every other team once
 */
export function generateRoundRobinMatches(
  teams: Team[],
  tournamentId: string,
  seriesId: string
): Match[] {
  const matches: Match[] = [];

  // Round-robin algorithm: each team plays every other team once
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournament_id: tournamentId,
        series_id: seriesId,
        team1_id: teams[i].id,
        team2_id: teams[j].id,
        scheduled_date: null,
        scheduled_time: null,
        court_id: null,
        status: 'scheduled',
      });
    }
  }

  return matches;
}

/**
 * Assign time slots to matches (ENHANCED VERSION)
 * Considers tournament start/end dates, available time slots, and team unavailability
 */
export async function assignTimeSlots(
  matches: Match[],
  tournamentId: string,
  startDate: string,
  endDate?: string
): Promise<Match[]> {
  const supabase = await createServerClient();

  // Fetch available time slots
  const { data: timeSlots } = await supabase
    .from('tournament_time_slots')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  if (!timeSlots || timeSlots.length === 0) {
    return matches;
  }

  // Fetch team unavailability
  const teamIds = matches.flatMap((m) => [m.team1_id, m.team2_id]);
  const { data: unavailability } = await supabase
    .from('tournament_team_unavailability')
    .select('registration_id, day_of_week, start_time, end_time')
    .in('registration_id', teamIds);

  const startDateObj = new Date(startDate);
  const endDateObj = endDate ? new Date(endDate) : new Date(startDateObj.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

  // Track which slots are used on which dates
  const usedSlots = new Map<string, Set<string>>();

  // Track when each team last played
  const teamLastMatch = new Map<string, { date: string; time: string }>();

  const matchesWithSchedule = [...matches];

  for (let i = 0; i < matchesWithSchedule.length; i++) {
    const match = matchesWithSchedule[i];
    let assigned = false;
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj && !assigned) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      const daySlots = timeSlots.filter((slot) => slot.day_of_week === dayOfWeek);

      for (const slot of daySlots) {
        const slotKey = `${dateStr}-${slot.id}`;

        if (!usedSlots.has(dateStr)) {
          usedSlots.set(dateStr, new Set());
        }

        if (usedSlots.get(dateStr)!.has(slot.id)) continue;

        // Check team unavailability - check if slot time overlaps with any unavailable time range
        const team1Unavailable = unavailability?.some((u) => {
          if (u.registration_id !== match.team1_id || u.day_of_week !== dayOfWeek) return false;
          // Check if slot time range overlaps with unavailable time range
          // Overlap occurs if: slot.start < unavail.end AND slot.end > unavail.start
          return !(slot.end_time <= u.start_time || slot.start_time >= u.end_time);
        });
        const team2Unavailable = unavailability?.some((u) => {
          if (u.registration_id !== match.team2_id || u.day_of_week !== dayOfWeek) return false;
          // Check if slot time range overlaps with unavailable time range
          return !(slot.end_time <= u.start_time || slot.start_time >= u.end_time);
        });

        if (team1Unavailable || team2Unavailable) continue;

        // Avoid back-to-back matches on same day
        const team1Last = teamLastMatch.get(match.team1_id);
        const team2Last = teamLastMatch.get(match.team2_id);

        if (team1Last?.date === dateStr || team2Last?.date === dateStr) continue;

        // Assign slot
        match.scheduled_date = dateStr;
        match.scheduled_time = slot.start_time;
        match.court_id = slot.court_id;

        usedSlots.get(dateStr)!.add(slot.id);
        teamLastMatch.set(match.team1_id, { date: dateStr, time: slot.start_time });
        teamLastMatch.set(match.team2_id, { date: dateStr, time: slot.start_time });

        assigned = true;
        break;
      }

      if (assigned) break;
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return matchesWithSchedule;
}

/**
 * Create a series (group) for a category
 */
export async function createSeries(
  tournamentId: string,
  categoryId: string,
  seriesName: string,
  seriesNumber: number,
  teamCount: number,
  phase: 'groups' | 'playoffs' | 'finals' = 'groups'
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('tournament_series')
    .insert({
      tournament_id: tournamentId,
      category_id: categoryId,
      name: seriesName,
      series_number: seriesNumber,
      phase: phase,
      status: 'pending',
      team_count: teamCount,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating series:', error);
    throw error;
  }

  return data;
}

/**
 * Assign teams to a series and create series_teams entries
 */
export async function assignTeamsToSeries(seriesId: string, teamIds: string[]) {
  const supabase = await createServerClient();

  const seriesTeams = teamIds.map((teamId, index) => ({
    series_id: seriesId,
    registration_id: teamId,
    position: index + 1,
    points: 0,
    matches_played: 0,
    matches_won: 0,
    matches_lost: 0,
    sets_won: 0,
    sets_lost: 0,
    games_won: 0,
    games_lost: 0,
  }));

  const { error } = await supabase.from('tournament_series_teams').insert(seriesTeams);

  if (error) {
    console.error('Error assigning teams to series:', error);
    throw error;
  }
}

/**
 * Save matches to database
 */
export async function saveMatches(matches: Match[]) {
  const supabase = await createServerClient();

  const { error } = await supabase.from('tournament_matches').insert(matches);

  if (error) {
    console.error('Error saving matches:', error);
    throw error;
  }
}

/**
 * Complete workflow: Create series, assign teams, generate and save matches
 */
export async function generateFixtures(
  tournamentId: string,
  categoryId: string,
  teamIds: string[],
  seriesName: string,
  seriesNumber: number,
  assignSchedule: boolean = true
) {
  if (teamIds.length < 2) {
    throw new Error('Se necesitan al menos 2 equipos para generar partidos');
  }

  const supabase = await createServerClient();

  // Fetch team data
  const { data: teamsRaw } = await supabase
    .from('tournament_registrations')
    .select('id, team_name')
    .in('id', teamIds);

  if (!teamsRaw || teamsRaw.length === 0) {
    throw new Error('No se encontraron equipos');
  }

  // Transform teams to ensure non-null team_name
  const teams = teamsRaw
    .filter((team) => team.team_name)
    .map((team) => ({
      id: team.id,
      team_name: team.team_name as string,
    }));

  // Get tournament start date
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('start_date, end_date')
    .eq('id', tournamentId)
    .single();

  if (!tournament) {
    throw new Error('Torneo no encontrado');
  }

  // 1. Create series
  const series = await createSeries(tournamentId, categoryId, seriesName, seriesNumber, teamIds.length);

  // 2. Assign teams to series
  await assignTeamsToSeries(series.id, teamIds);

  // 3. Generate round-robin matches
  let matches = generateRoundRobinMatches(teams, tournamentId, series.id);

  // 4. Assign time slots if requested
  if (assignSchedule) {
    matches = await assignTimeSlots(matches, tournamentId, tournament.start_date, tournament.end_date || undefined);
  }

  // 5. Save matches to database
  await saveMatches(matches);

  return {
    seriesId: series.id,
    matchCount: matches.length,
  };
}

/**
 * Helper: Calculate total matches for a group
 */
export function calculateGroupMatches(teamCount: number): number {
  return (teamCount * (teamCount - 1)) / 2;
}

/**
 * Helper: Estimate tournament duration
 */
export function estimateTournamentDuration(
  totalMatches: number,
  slotsPerDay: number,
  courtsAvailable: number
): number {
  const matchesPerDay = slotsPerDay * courtsAvailable;
  return Math.ceil(totalMatches / matchesPerDay);
}

/**
 * Validates if tournament can be completed within date range
 */
export async function validateSchedulingFeasibility(
  matchCount: number,
  tournamentId: string,
  startDate: string,
  endDate: string
): Promise<{ feasible: boolean; reason?: string }> {
  const supabase = await createServerClient();

  const { data: timeSlots } = await supabase
    .from('tournament_time_slots')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('is_active', true);

  if (!timeSlots || timeSlots.length === 0) {
    return {
      feasible: false,
      reason: 'No hay horarios configurados para el torneo',
    };
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const daysInRange = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

  const slotsPerWeek = timeSlots.length;
  const weeks = daysInRange / 7;
  const totalAvailableSlots = Math.floor(slotsPerWeek * weeks);

  if (totalAvailableSlots < matchCount) {
    return {
      feasible: false,
      reason: `No hay suficientes horarios. Se necesitan ${matchCount} partidos pero solo hay ~${totalAvailableSlots} espacios disponibles.`,
    };
  }

  return { feasible: true };
}
