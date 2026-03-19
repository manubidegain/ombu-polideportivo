/**
 * Group Optimizer - Intelligent group configuration for tournaments
 * Minimizes matches while ensuring fairness
 */

export type GroupConfiguration = {
  groupCount: number;
  teamsPerGroup: number[];
  totalMatches: number;
  distribution: 'balanced' | 'mixed';
};

export type GroupDistribution = {
  groups: {
    id: string;
    name: string;
    teams: string[]; // team registration IDs
  }[];
};

/**
 * Suggests optimal group configuration for a given number of teams
 * Prioritizes groups of 3 (minimum matches) over groups of 4
 */
export function suggestGroupConfiguration(teamCount: number): GroupConfiguration {
  // Edge cases
  if (teamCount < 3) {
    throw new Error('Minimum 3 teams required for tournament');
  }

  if (teamCount <= 4) {
    // Single group for 3-4 teams
    return {
      groupCount: 1,
      teamsPerGroup: [teamCount],
      totalMatches: (teamCount * (teamCount - 1)) / 2,
      distribution: 'balanced',
    };
  }

  // Try to divide into groups of 3 (most efficient)
  if (teamCount % 3 === 0) {
    const groupCount = teamCount / 3;
    return {
      groupCount,
      teamsPerGroup: Array(groupCount).fill(3),
      totalMatches: groupCount * 3, // Each group of 3 has 3 matches
      distribution: 'balanced',
    };
  }

  // Try to divide into groups of 4
  if (teamCount % 4 === 0) {
    const groupCount = teamCount / 4;
    return {
      groupCount,
      teamsPerGroup: Array(groupCount).fill(4),
      totalMatches: groupCount * 6, // Each group of 4 has 6 matches
      distribution: 'balanced',
    };
  }

  // Mixed groups - try to minimize variance
  const groupsOf3 = Math.floor(teamCount / 3);
  const remainder = teamCount % 3;

  if (remainder === 1) {
    // One extra team: convert one group of 3 to group of 4
    // Example: 7 teams → [3, 4] instead of [3, 3, 1]
    if (groupsOf3 === 1) {
      // Special case: 4 teams total
      return {
        groupCount: 1,
        teamsPerGroup: [4],
        totalMatches: 6,
        distribution: 'balanced',
      };
    }
    return {
      groupCount: groupsOf3,
      teamsPerGroup: [...Array(groupsOf3 - 1).fill(3), 4],
      totalMatches: (groupsOf3 - 1) * 3 + 6,
      distribution: 'mixed',
    };
  } else if (remainder === 2) {
    // Two extra teams: convert two groups of 3 to groups of 4
    // Example: 8 teams → [4, 4] instead of [3, 3, 2]
    if (groupsOf3 === 1) {
      // Special case: 5 teams total → one group of 5
      return {
        groupCount: 1,
        teamsPerGroup: [5],
        totalMatches: 10,
        distribution: 'balanced',
      };
    }
    return {
      groupCount: groupsOf3,
      teamsPerGroup: [...Array(groupsOf3 - 2).fill(3), 4, 4],
      totalMatches: (groupsOf3 - 2) * 3 + 6 + 6,
      distribution: 'mixed',
    };
  }

  // Should never reach here, but fallback
  return {
    groupCount: groupsOf3,
    teamsPerGroup: Array(groupsOf3).fill(3),
    totalMatches: groupsOf3 * 3,
    distribution: 'balanced',
  };
}

/**
 * Validates a manual group configuration
 */
export function validateGroupConfiguration(
  teamCount: number,
  teamsPerGroup: number[]
): { valid: boolean; error?: string } {
  const totalTeams = teamsPerGroup.reduce((sum, count) => sum + count, 0);

  if (totalTeams !== teamCount) {
    return {
      valid: false,
      error: `La suma de equipos en grupos (${totalTeams}) no coincide con total de equipos (${teamCount})`,
    };
  }

  const hasSmallGroups = teamsPerGroup.some((count) => count < 3);
  if (hasSmallGroups) {
    return {
      valid: false,
      error: 'Todos los grupos deben tener al menos 3 equipos',
    };
  }

  return { valid: true };
}

/**
 * Distributes teams into groups
 * Can be random or seeded (if teams have rankings)
 */
export function distributeTeamsIntoGroups(
  teamIds: string[],
  teamsPerGroup: number[],
  method: 'random' | 'snake' = 'snake'
): GroupDistribution {
  const groups: GroupDistribution['groups'] = [];
  const groupCount = teamsPerGroup.length;

  // Initialize groups
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      id: `group-${i + 1}`,
      name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      teams: [],
    });
  }

  if (method === 'random') {
    // Shuffle teams randomly
    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
    let teamIndex = 0;

    for (let i = 0; i < groupCount; i++) {
      for (let j = 0; j < teamsPerGroup[i]; j++) {
        groups[i].teams.push(shuffled[teamIndex]);
        teamIndex++;
      }
    }
  } else {
    // Snake draft distribution (for seeded teams)
    // Example: 1→A, 2→B, 3→C, 4→C, 5→B, 6→A, 7→A, 8→B, 9→C
    let teamIndex = 0;
    let forward = true;

    while (teamIndex < teamIds.length) {
      const indices = forward
        ? Array.from({ length: groupCount }, (_, i) => i)
        : Array.from({ length: groupCount }, (_, i) => groupCount - 1 - i);

      for (const groupIdx of indices) {
        if (groups[groupIdx].teams.length < teamsPerGroup[groupIdx]) {
          groups[groupIdx].teams.push(teamIds[teamIndex]);
          teamIndex++;
          if (teamIndex >= teamIds.length) break;
        }
      }

      forward = !forward;
    }
  }

  return { groups };
}

/**
 * Calculates total matches needed for a configuration
 */
export function calculateTotalMatches(teamsPerGroup: number[]): number {
  return teamsPerGroup.reduce((total, count) => {
    return total + (count * (count - 1)) / 2;
  }, 0);
}

/**
 * Suggests number of teams that should advance to playoffs
 */
export function suggestPlayoffSize(totalTeams: number, groupCount: number): number {
  if (totalTeams <= 4) {
    return 2; // Top 2 to final
  }

  if (totalTeams <= 6) {
    return 4; // Semifinals
  }

  if (totalTeams <= 12) {
    // 2 per group or max 8
    return Math.min(8, groupCount * 2);
  }

  return 8; // Standard 8-team playoff bracket
}

/**
 * Generates qualification rule options for admin to choose
 */
export function generateQualificationOptions(groupCount: number): {
  label: string;
  value: string;
  playoffSize: number;
}[] {
  const options = [];

  // Top 1 per group
  options.push({
    label: `Top 1 por grupo (${groupCount} equipos)`,
    value: 'top1',
    playoffSize: groupCount,
  });

  // Top 2 per group (if multiple groups)
  if (groupCount >= 2) {
    options.push({
      label: `Top 2 por grupo (${groupCount * 2} equipos)`,
      value: 'top2',
      playoffSize: groupCount * 2,
    });
  }

  // Top 1 + best 2nds
  if (groupCount >= 3) {
    const bestSecondCount = Math.min(groupCount, 8 - groupCount);
    if (bestSecondCount > 0) {
      options.push({
        label: `Top 1 + ${bestSecondCount} mejores 2dos (${
          groupCount + bestSecondCount
        } equipos)`,
        value: `top1-best${bestSecondCount}`,
        playoffSize: groupCount + bestSecondCount,
      });
    }
  }

  // Top 3 per group (if 3+ teams per group)
  if (groupCount >= 2) {
    options.push({
      label: `Top 3 por grupo (${groupCount * 3} equipos)`,
      value: 'top3',
      playoffSize: groupCount * 3,
    });
  }

  return options;
}
