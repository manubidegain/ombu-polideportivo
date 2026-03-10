import { createServerClient } from '@/lib/supabase/server';

export type AchievementType =
  | 'champion'
  | 'runner_up'
  | 'third_place'
  | 'perfect_record'
  | 'first_tournament'
  | 'veteran_5'
  | 'veteran_10'
  | 'comeback_king'
  | 'dominator'
  | 'top_scorer';

export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  {
    name: string;
    description: string;
    emoji: string;
  }
> = {
  champion: {
    name: 'Campeón',
    description: 'Ganaste el torneo',
    emoji: '🏆',
  },
  runner_up: {
    name: 'Subcampeón',
    description: 'Segundo lugar en el torneo',
    emoji: '🥈',
  },
  third_place: {
    name: 'Tercer Puesto',
    description: 'Tercer lugar en el torneo',
    emoji: '🥉',
  },
  perfect_record: {
    name: 'Récord Perfecto',
    description: 'Ganaste todos los partidos de la serie',
    emoji: '💯',
  },
  first_tournament: {
    name: 'Primer Torneo',
    description: 'Participaste en tu primer torneo',
    emoji: '🎯',
  },
  veteran_5: {
    name: 'Veterano',
    description: 'Participaste en 5 torneos',
    emoji: '⭐',
  },
  veteran_10: {
    name: 'Leyenda',
    description: 'Participaste en 10 torneos',
    emoji: '🌟',
  },
  comeback_king: {
    name: 'Rey del Comeback',
    description: 'Ganaste después de perder el primer set',
    emoji: '👑',
  },
  dominator: {
    name: 'Dominador',
    description: 'Ganaste sin perder un set',
    emoji: '⚡',
  },
  top_scorer: {
    name: 'Máximo Goleador',
    description: 'Mayor cantidad de puntos en tu categoría',
    emoji: '🎖️',
  },
};

/**
 * Award an achievement to a player
 */
export async function awardAchievement(
  userId: string,
  achievementType: AchievementType,
  tournamentId?: string,
  categoryId?: string,
  metadata?: Record<string, any>
) {
  const supabase = await createServerClient();

  // Check if achievement already exists
  let query = supabase
    .from('player_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_type', achievementType);

  if (tournamentId) {
    query = query.eq('tournament_id', tournamentId);
  } else {
    query = query.is('tournament_id', null);
  }

  const { data: existing } = await query.single();

  if (existing) {
    return { success: false, message: 'Achievement already awarded' };
  }

  // Insert new achievement using service role to bypass RLS
  const { data, error } = await supabase
    .from('player_achievements')
    .insert({
      user_id: userId,
      achievement_type: achievementType,
      tournament_id: tournamentId,
      category_id: categoryId,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error awarding achievement:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

/**
 * Check and award "first_tournament" achievement
 */
export async function checkFirstTournamentAchievement(userId: string, tournamentId: string) {
  const supabase = await createServerClient();

  // Count user's tournament participations
  const { count } = await supabase
    .from('tournament_registrations')
    .select('*', { count: 'exact', head: true })
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', 'confirmed');

  if (count === 1) {
    await awardAchievement(userId, 'first_tournament', tournamentId);
  }
}

/**
 * Check and award veteran achievements (5 and 10 tournaments)
 */
export async function checkVeteranAchievements(userId: string) {
  const supabase = await createServerClient();

  // Count distinct tournaments user participated in
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select('tournament_id')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('status', 'confirmed');

  if (!registrations) return;

  const uniqueTournaments = new Set(registrations.map((r) => r.tournament_id));
  const tournamentCount = uniqueTournaments.size;

  if (tournamentCount >= 10) {
    await awardAchievement(userId, 'veteran_10');
  } else if (tournamentCount >= 5) {
    await awardAchievement(userId, 'veteran_5');
  }
}

/**
 * Check and award match-specific achievements after a match is completed
 */
export async function checkMatchAchievements(matchId: string) {
  const supabase = await createServerClient();

  // Fetch match with full details
  const { data: match } = await supabase
    .from('tournament_matches')
    .select(
      `
      *,
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        player1_id,
        player2_id
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        player1_id,
        player2_id
      ),
      winner:tournament_registrations!tournament_matches_winner_id_fkey (
        player1_id,
        player2_id
      )
    `
    )
    .eq('id', matchId)
    .single();

  if (!match || !match.score || !match.winner) return;

  const score = match.score as any;
  const sets = score?.sets || [];
  if (sets.length === 0) return;

  // Determine which team won
  const isTeam1Winner = match.winner_id === match.team1_id;
  const winnerPlayers = (isTeam1Winner
    ? [match.team1.player1_id, match.team1.player2_id]
    : [match.team2.player1_id, match.team2.player2_id]
  ).filter((id): id is string => Boolean(id));

  // Count sets won by each team
  let team1Sets = 0;
  let team2Sets = 0;
  let firstSetWinner: 'team1' | 'team2' | null = null;

  sets.forEach((set: any, index: number) => {
    if (set.team1 > set.team2) {
      team1Sets++;
      if (index === 0) firstSetWinner = 'team1';
    } else {
      team2Sets++;
      if (index === 0) firstSetWinner = 'team2';
    }
  });

  const winnerSetsWon = isTeam1Winner ? team1Sets : team2Sets;
  const loserSetsWon = isTeam1Winner ? team2Sets : team1Sets;

  // Check for "dominator" - won without losing a set
  if (loserSetsWon === 0) {
    for (const playerId of winnerPlayers) {
      await awardAchievement(playerId, 'dominator', match.tournament_id || undefined, undefined, {
        match_id: matchId,
        score: sets,
      });
    }
  }

  // Check for "comeback_king" - won after losing first set
  const wonAfterLosingFirstSet =
    (isTeam1Winner && firstSetWinner === 'team2') ||
    (!isTeam1Winner && firstSetWinner === 'team1');

  if (wonAfterLosingFirstSet) {
    for (const playerId of winnerPlayers) {
      await awardAchievement(playerId, 'comeback_king', match.tournament_id || undefined, undefined, {
        match_id: matchId,
        score: sets,
      });
    }
  }
}

/**
 * Check and award "perfect_record" achievement for a completed series
 */
export async function checkPerfectRecordAchievement(seriesId: string) {
  const supabase = await createServerClient();

  // Get all teams in series with their records
  const { data: teams } = await supabase
    .from('tournament_series_teams')
    .select(
      `
      *,
      registration:tournament_registrations (
        player1_id,
        player2_id,
        tournament_id,
        category_id
      ),
      series:tournament_series (
        tournament_id,
        category_id
      )
    `
    )
    .eq('series_id', seriesId);

  if (!teams) return;

  // Find teams with perfect record (all matches won)
  for (const team of teams) {
    if ((team.matches_played || 0) > 0 && (team.matches_lost || 0) === 0) {
      const players = [team.registration.player1_id, team.registration.player2_id].filter(
        (id): id is string => Boolean(id)
      );

      for (const playerId of players) {
        await awardAchievement(
          playerId,
          'perfect_record',
          team.series.tournament_id || undefined,
          team.series.category_id || undefined,
          {
            series_id: seriesId,
            matches_won: team.matches_won,
          }
        );
      }
    }
  }
}

/**
 * Award tournament placement achievements (champion, runner_up, third_place)
 */
export async function awardTournamentPlacementAchievements(
  tournamentId: string,
  categoryId: string,
  firstPlaceTeamId: string,
  secondPlaceTeamId?: string,
  thirdPlaceTeamId?: string
) {
  const supabase = await createServerClient();

  // Get team registrations
  const teamIds = [firstPlaceTeamId, secondPlaceTeamId, thirdPlaceTeamId].filter(
    (id): id is string => Boolean(id)
  );
  const { data: teams } = await supabase
    .from('tournament_registrations')
    .select('id, player1_id, player2_id')
    .in('id', teamIds);

  if (!teams) return;

  // Award champion
  const championTeam = teams.find((t) => t.id === firstPlaceTeamId);
  if (championTeam) {
    const players = [championTeam.player1_id, championTeam.player2_id].filter(
      (id): id is string => Boolean(id)
    );
    for (const playerId of players) {
      await awardAchievement(playerId, 'champion', tournamentId, categoryId, {
        team_id: firstPlaceTeamId,
      });
    }
  }

  // Award runner_up
  if (secondPlaceTeamId) {
    const runnerUpTeam = teams.find((t) => t.id === secondPlaceTeamId);
    if (runnerUpTeam) {
      const players = [runnerUpTeam.player1_id, runnerUpTeam.player2_id].filter(
        (id): id is string => Boolean(id)
      );
      for (const playerId of players) {
        await awardAchievement(playerId, 'runner_up', tournamentId, categoryId, {
          team_id: secondPlaceTeamId,
        });
      }
    }
  }

  // Award third_place
  if (thirdPlaceTeamId) {
    const thirdPlaceTeam = teams.find((t) => t.id === thirdPlaceTeamId);
    if (thirdPlaceTeam) {
      const players = [thirdPlaceTeam.player1_id, thirdPlaceTeam.player2_id].filter(
        (id): id is string => Boolean(id)
      );
      for (const playerId of players) {
        await awardAchievement(playerId, 'third_place', tournamentId, categoryId, {
          team_id: thirdPlaceTeamId,
        });
      }
    }
  }
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('player_achievements')
    .select(
      `
      *,
      tournament:tournaments (
        name,
        start_date
      ),
      category:tournament_categories (
        name
      )
    `
    )
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}
