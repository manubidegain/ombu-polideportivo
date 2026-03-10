import { createServerClient } from '@/lib/supabase/server';

type Team = {
  id: string;
  team_name: string;
};

type TimeSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
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
 * Assign time slots to matches
 * Considers tournament start date and available time slots
 */
export async function assignTimeSlots(
  matches: Match[],
  tournamentId: string,
  startDate: string
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
    // No time slots available, return matches without schedules
    return matches;
  }

  // Get starting date
  const startDateObj = new Date(startDate);
  const matchesWithSchedule = [...matches];

  // Simple algorithm: assign matches sequentially to available time slots
  // Starting from tournament start date
  let currentDate = new Date(startDateObj);
  let slotIndex = 0;

  for (let i = 0; i < matchesWithSchedule.length; i++) {
    const slot = timeSlots[slotIndex % timeSlots.length];

    // Find next date that matches the day_of_week
    while (currentDate.getDay() !== slot.day_of_week) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    matchesWithSchedule[i].scheduled_date = currentDate.toISOString().split('T')[0];
    matchesWithSchedule[i].scheduled_time = slot.start_time;
    matchesWithSchedule[i].court_id = slot.court_id;

    slotIndex++;

    // If we've used all slots for this day, move to next occurrence
    if (slotIndex % timeSlots.filter(s => s.day_of_week === slot.day_of_week).length === 0) {
      // Move to next week's occurrence of this day
      currentDate.setDate(currentDate.getDate() + 7);
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
    .select('start_date')
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
    matches = await assignTimeSlots(matches, tournamentId, tournament.start_date);
  }

  // 5. Save matches to database
  await saveMatches(matches);

  return {
    seriesId: series.id,
    matchCount: matches.length,
  };
}
