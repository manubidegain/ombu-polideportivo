/**
 * Ranking Calculator - Determines team standings and playoff qualifiers
 * Ranking criteria: Sets Won → Games Won → Head-to-Head
 */

export type TeamStats = {
  teamId: string;
  teamName: string;
  groupId: string;
  groupName: string;
  groupRank: number;

  // Match statistics
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;

  // Set statistics (supertiebreak counts as 1 set)
  setsWon: number;
  setsLost: number;

  // Game statistics
  gamesWon: number;
  gamesLost: number;
};

export type MatchResult = {
  id: string;
  team1Id: string;
  team2Id: string;
  winnerId: string | null;
  score: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  } | null;
};

/**
 * Calculates team statistics from match results
 */
export function calculateTeamStats(
  teamId: string,
  teamName: string,
  groupId: string,
  groupName: string,
  matches: MatchResult[]
): TeamStats {
  const stats: TeamStats = {
    teamId,
    teamName,
    groupId,
    groupName,
    groupRank: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };

  for (const match of matches) {
    // Skip matches without results
    if (!match.score || !match.winnerId) continue;

    const isTeam1 = match.team1Id === teamId;
    const isTeam2 = match.team2Id === teamId;

    if (!isTeam1 && !isTeam2) continue;

    stats.matchesPlayed++;

    if (match.winnerId === teamId) {
      stats.matchesWon++;
    } else {
      stats.matchesLost++;
    }

    // Count sets
    for (const set of match.score.sets) {
      if (isTeam1) {
        if (set.team1 > set.team2) stats.setsWon++;
        else if (set.team2 > set.team1) stats.setsLost++;

        stats.gamesWon += set.team1;
        stats.gamesLost += set.team2;
      } else {
        if (set.team2 > set.team1) stats.setsWon++;
        else if (set.team1 > set.team2) stats.setsLost++;

        stats.gamesWon += set.team2;
        stats.gamesLost += set.team1;
      }
    }

    // Count supertiebreak as a set
    if (match.score.supertiebreak) {
      const sb = match.score.supertiebreak;
      if (isTeam1) {
        if (sb.team1 > sb.team2) stats.setsWon++;
        else stats.setsLost++;

        stats.gamesWon += sb.team1;
        stats.gamesLost += sb.team2;
      } else {
        if (sb.team2 > sb.team1) stats.setsWon++;
        else stats.setsLost++;

        stats.gamesWon += sb.team2;
        stats.gamesLost += sb.team1;
      }
    }
  }

  return stats;
}

/**
 * Compares two teams using official ranking criteria
 * Returns: negative if team1 should rank higher, positive if team2 should rank higher
 */
export function compareTeams(
  team1: TeamStats,
  team2: TeamStats,
  matches: MatchResult[]
): number {
  // 1. Set difference (higher is better)
  const team1SetDiff = team1.setsWon - team1.setsLost;
  const team2SetDiff = team2.setsWon - team2.setsLost;

  if (team1SetDiff !== team2SetDiff) {
    return team2SetDiff - team1SetDiff;
  }

  // 2. Game difference (higher is better)
  const team1GameDiff = team1.gamesWon - team1.gamesLost;
  const team2GameDiff = team2.gamesWon - team2.gamesLost;

  if (team1GameDiff !== team2GameDiff) {
    return team2GameDiff - team1GameDiff;
  }

  // 3. Head-to-head result
  const h2h = getHeadToHeadWinner(team1.teamId, team2.teamId, matches);
  if (h2h) {
    return h2h === team1.teamId ? -1 : 1;
  }

  // 4. If still tied, maintain current order (stable sort)
  return 0;
}

/**
 * Finds head-to-head winner between two teams
 * Returns the winner's team ID, or null if they didn't play or tied
 */
function getHeadToHeadWinner(
  team1Id: string,
  team2Id: string,
  matches: MatchResult[]
): string | null {
  const h2hMatch = matches.find(
    (m) =>
      (m.team1Id === team1Id && m.team2Id === team2Id) ||
      (m.team1Id === team2Id && m.team2Id === team1Id)
  );

  return h2hMatch?.winnerId || null;
}

/**
 * Ranks all teams within a group
 */
export function rankGroupTeams(
  teams: Array<{ id: string; name: string }>,
  groupId: string,
  groupName: string,
  matches: MatchResult[]
): TeamStats[] {
  // Calculate stats for each team
  const teamStats = teams.map((team) =>
    calculateTeamStats(team.id, team.name, groupId, groupName, matches)
  );

  // Sort using comparison function
  teamStats.sort((a, b) => compareTeams(a, b, matches));

  // Assign ranks
  teamStats.forEach((stats, index) => {
    stats.groupRank = index + 1;
  });

  return teamStats;
}

/**
 * Selects teams that qualify for playoffs based on qualification rule
 */
export function selectPlayoffQualifiers(
  allGroupStandings: TeamStats[][],
  qualificationRule: string
): TeamStats[] {
  const qualifiers: TeamStats[] = [];

  if (qualificationRule === 'top1') {
    // Top 1 from each group
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(groupStandings[0]);
    }
  } else if (qualificationRule === 'top2') {
    // Top 2 from each group
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(groupStandings[0], groupStandings[1]);
    }
  } else if (qualificationRule === 'top1-best3rds') {
    // Top 1 from each group + all 2nd place + best 3rd place
    // Specifically for 9 teams (3 groups of 3): 3 firsts + 3 seconds + 1 best third = 7

    // Add all first place teams
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(groupStandings[0]);
    }

    // Add all second place teams
    for (const groupStandings of allGroupStandings) {
      if (groupStandings[1]) {
        qualifiers.push(groupStandings[1]);
      }
    }

    // Collect all third place teams
    const thirdPlaceTeams = allGroupStandings
      .map((standings) => standings[2])
      .filter(Boolean);

    // Sort third place teams using same criteria
    thirdPlaceTeams.sort((a, b) => compareTeams(a, b, []));

    // Add best third place team
    if (thirdPlaceTeams.length > 0) {
      qualifiers.push(thirdPlaceTeams[0]);
    }
  } else if (qualificationRule.startsWith('top1-best')) {
    // Top 1 from each group + best 2nd place teams
    const bestCount = parseInt(qualificationRule.replace('top1-best', ''));

    // Add all first place teams
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(groupStandings[0]);
    }

    // Collect all second place teams
    const secondPlaceTeams = allGroupStandings
      .map((standings) => standings[1])
      .filter(Boolean);

    // Sort second place teams using same criteria
    secondPlaceTeams.sort((a, b) => compareTeams(a, b, []));

    // Add best N second place teams
    qualifiers.push(...secondPlaceTeams.slice(0, bestCount));
  } else if (qualificationRule === 'top3') {
    // Top 3 from each group
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(groupStandings[0], groupStandings[1], groupStandings[2]);
    }
  } else if (qualificationRule === 'custom') {
    // Custom rule: all teams qualify (for structures like 9 teams)
    for (const groupStandings of allGroupStandings) {
      qualifiers.push(...groupStandings);
    }
  }

  return qualifiers;
}

/**
 * Seeds playoff teams (assigns seeds 1-N based on group performance)
 */
export function seedPlayoffTeams(qualifiers: TeamStats[]): TeamStats[] {
  // Separate by group rank
  const firstPlace = qualifiers.filter((t) => t.groupRank === 1);
  const secondPlace = qualifiers.filter((t) => t.groupRank === 2);
  const thirdPlace = qualifiers.filter((t) => t.groupRank === 3);

  // Sort each tier
  firstPlace.sort((a, b) => compareTeams(a, b, []));
  secondPlace.sort((a, b) => compareTeams(a, b, []));
  thirdPlace.sort((a, b) => compareTeams(a, b, []));

  // Combine: all 1sts, then 2nds, then 3rds
  return [...firstPlace, ...secondPlace, ...thirdPlace];
}

/**
 * Checks if all matches in a group have been completed
 */
export function isGroupComplete(matches: MatchResult[]): boolean {
  return matches.every((match) => match.winnerId !== null && match.score !== null);
}

/**
 * Checks if all groups are complete
 */
export function areAllGroupsComplete(matchesByGroup: Record<string, MatchResult[]>): boolean {
  return Object.values(matchesByGroup).every((matches) => isGroupComplete(matches));
}

/**
 * Formats team stats for display
 */
export function formatTeamStatsDisplay(stats: TeamStats): {
  position: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  sets: string;
  games: string;
} {
  return {
    position: stats.groupRank,
    team: stats.teamName,
    played: stats.matchesPlayed,
    won: stats.matchesWon,
    lost: stats.matchesLost,
    sets: `${stats.setsWon}-${stats.setsLost}`,
    games: `${stats.gamesWon}-${stats.gamesLost}`,
  };
}
