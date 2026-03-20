import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createServerClient();

    // Get all series for this tournament
    const { data: series, error: seriesError } = await supabase
      .from('tournament_series')
      .select(
        `
        id,
        name,
        phase,
        series_number,
        category_id,
        tournament_categories (name)
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('phase', 'groups')
      .order('series_number');

    if (seriesError) throw seriesError;

    // For each series, get teams and calculate standings
    const groupStandings = await Promise.all(
      (series || []).map(async (s: any) => {
        // Get teams in this series
        const { data: seriesTeams } = await supabase
          .from('tournament_series_teams')
          .select(
            `
          registration_id,
          tournament_registrations (
            id,
            team_name
          )
        `
          )
          .eq('series_id', s.id);

        const teams =
          seriesTeams?.map((st: any) => ({
            id: st.tournament_registrations.id,
            name: st.tournament_registrations.team_name,
          })) || [];

        if (teams.length === 0) {
          return null;
        }

        // Get matches for this series
        const { data: matches } = await supabase
          .from('tournament_matches')
          .select('id, team1_id, team2_id, status, score, winner_id')
          .eq('series_id', s.id)
          .eq('status', 'completed');

        // Calculate standings
        const standings = teams.map((team) => {
          let matchesPlayed = 0;
          let matchesWon = 0;
          let matchesLost = 0;
          let setsWon = 0;
          let setsLost = 0;
          let gamesWon = 0;
          let gamesLost = 0;

          (matches || []).forEach((match: any) => {
            const isTeam1 = match.team1_id === team.id;
            const isTeam2 = match.team2_id === team.id;

            if (!isTeam1 && !isTeam2) return;

            matchesPlayed++;

            if (match.winner_id === team.id) {
              matchesWon++;
            } else {
              matchesLost++;
            }

            // Calculate sets and games (exclude supertiebreak from games count)
            if (match.score?.sets) {
              match.score.sets.forEach((set: any) => {
                if (isTeam1) {
                  setsWon += set.team1 > set.team2 ? 1 : 0;
                  setsLost += set.team2 > set.team1 ? 1 : 0;
                  gamesWon += set.team1;
                  gamesLost += set.team2;
                } else {
                  setsWon += set.team2 > set.team1 ? 1 : 0;
                  setsLost += set.team1 > set.team2 ? 1 : 0;
                  gamesWon += set.team2;
                  gamesLost += set.team1;
                }
              });
            }

            // Supertiebreak counts as a set but points don't count as games
            if (match.score?.supertiebreak) {
              if (isTeam1) {
                setsWon += match.score.supertiebreak.team1 > match.score.supertiebreak.team2 ? 1 : 0;
                setsLost += match.score.supertiebreak.team2 > match.score.supertiebreak.team1 ? 1 : 0;
              } else {
                setsWon += match.score.supertiebreak.team2 > match.score.supertiebreak.team1 ? 1 : 0;
                setsLost += match.score.supertiebreak.team1 > match.score.supertiebreak.team2 ? 1 : 0;
              }
            }
          });

          return {
            teamId: team.id,
            teamName: team.name,
            matchesPlayed,
            matchesWon,
            matchesLost,
            setsWon,
            setsLost,
            gamesWon,
            gamesLost,
            setDiff: setsWon - setsLost,
            gameDiff: gamesWon - gamesLost,
          };
        });

        // Sort standings: matches won > set diff > game diff
        standings.sort((a, b) => {
          if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
          if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
          return b.gameDiff - a.gameDiff;
        });

        // Add position
        standings.forEach((team, idx) => {
          (team as any).position = idx + 1;
        });

        // Calculate completion
        const totalMatches = (teams.length * (teams.length - 1)) / 2;
        const completedMatches = matches?.length || 0;

        return {
          seriesId: s.id,
          groupName: s.name,
          categoryName: s.tournament_categories?.name || 'Sin Categoría',
          phase: s.phase,
          standings,
          totalMatches,
          completedMatches,
          completionPercentage: Math.round(
            (completedMatches / totalMatches) * 100
          ),
          isComplete: completedMatches === totalMatches,
        };
      })
    );

    const validGroups = groupStandings.filter((g) => g !== null);

    return NextResponse.json({ success: true, groups: validGroups });
  } catch (error: any) {
    console.error('Error fetching public standings:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar posiciones' },
      { status: 500 }
    );
  }
}
