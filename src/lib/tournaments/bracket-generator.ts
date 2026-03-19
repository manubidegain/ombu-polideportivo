/**
 * Bracket Generator - Creates single-elimination playoff brackets
 * Handles seeding, bye assignments, and match tree creation
 */

import { TeamStats } from './ranking-calculator';

export type PlayoffMatch = {
  id: string; // Temporary ID for UI
  tournamentId: string;
  seriesId: string;
  team1Id: string | null; // null if waiting for previous match winner
  team2Id: string | null;
  round: 'quarter-final' | 'semi-final' | 'final';
  matchNumber: number; // Within the round
  nextMatchId: string | null; // Winner advances to this match
  bracketPosition: number; // For UI rendering
};

export type BracketStructure = {
  quarterFinals: PlayoffMatch[];
  semiFinals: PlayoffMatch[];
  final: PlayoffMatch;
  totalMatches: number;
};

/**
 * Determines optimal bracket structure based on number of qualifiers
 */
export function determineBracketSize(qualifierCount: number): {
  hasQuarterFinals: boolean;
  hasSemiFinals: boolean;
  byes: number;
} {
  if (qualifierCount === 2) {
    return { hasQuarterFinals: false, hasSemiFinals: false, byes: 0 };
  }

  if (qualifierCount <= 4) {
    return { hasQuarterFinals: false, hasSemiFinals: true, byes: 4 - qualifierCount };
  }

  if (qualifierCount <= 8) {
    return { hasQuarterFinals: true, hasSemiFinals: true, byes: 8 - qualifierCount };
  }

  // For more than 8 teams, we'd need more rounds (not implemented yet)
  throw new Error('Máximo 8 equipos soportados en playoffs actualmente');
}

/**
 * Creates playoff bracket structure
 * Implements standard seeding: 1 vs lowest, 2 vs 2nd lowest, etc.
 */
export function generatePlayoffBracket(
  tournamentId: string,
  categoryId: string,
  seededQualifiers: TeamStats[]
): BracketStructure {
  const qualifierCount = seededQualifiers.length;
  const structure = determineBracketSize(qualifierCount);

  let matchIdCounter = 1;
  const quarterFinals: PlayoffMatch[] = [];
  const semiFinals: PlayoffMatch[] = [];
  let final: PlayoffMatch;

  // Helper to create match
  const createMatch = (
    round: PlayoffMatch['round'],
    matchNumber: number,
    team1Id: string | null,
    team2Id: string | null,
    bracketPosition: number,
    nextMatchId: string | null = null
  ): PlayoffMatch => ({
    id: `playoff-match-${matchIdCounter++}`,
    tournamentId,
    seriesId: '', // Will be set when creating series
    team1Id,
    team2Id,
    round,
    matchNumber,
    nextMatchId,
    bracketPosition,
  });

  if (qualifierCount === 2) {
    // Direct final
    final = createMatch('final', 1, seededQualifiers[0].teamId, seededQualifiers[1].teamId, 1);

    return {
      quarterFinals: [],
      semiFinals: [],
      final,
      totalMatches: 1,
    };
  }

  if (qualifierCount <= 4) {
    // Semifinals only
    const sf1 = createMatch(
      'semi-final',
      1,
      seededQualifiers[0]?.teamId || null,
      seededQualifiers[3]?.teamId || null,
      1
    );

    const sf2 = createMatch(
      'semi-final',
      2,
      seededQualifiers[1]?.teamId || null,
      seededQualifiers[2]?.teamId || null,
      2
    );

    final = createMatch('final', 1, null, null, 1);

    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    semiFinals.push(sf1, sf2);

    return {
      quarterFinals: [],
      semiFinals,
      final,
      totalMatches: 3,
    };
  }

  // 5-8 teams: Quarter-finals + Semifinals + Final
  if (qualifierCount <= 8) {
    // Standard 8-team bracket seeding
    const seeds = Array(8).fill(null).map((_, i) => seededQualifiers[i]?.teamId || null);

    // Quarter-finals (QF)
    const qf1 = createMatch('quarter-final', 1, seeds[0], seeds[7], 1); // 1 vs 8
    const qf2 = createMatch('quarter-final', 2, seeds[3], seeds[4], 2); // 4 vs 5
    const qf3 = createMatch('quarter-final', 3, seeds[1], seeds[6], 3); // 2 vs 7
    const qf4 = createMatch('quarter-final', 4, seeds[2], seeds[5], 4); // 3 vs 6

    // Semi-finals (SF)
    const sf1 = createMatch('semi-final', 1, null, null, 1);
    const sf2 = createMatch('semi-final', 2, null, null, 2);

    // Final
    final = createMatch('final', 1, null, null, 1);

    // Link matches
    qf1.nextMatchId = sf1.id;
    qf2.nextMatchId = sf1.id;
    qf3.nextMatchId = sf2.id;
    qf4.nextMatchId = sf2.id;

    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    quarterFinals.push(qf1, qf2, qf3, qf4);
    semiFinals.push(sf1, sf2);

    return {
      quarterFinals,
      semiFinals,
      final,
      totalMatches: 7,
    };
  }

  throw new Error('Invalid qualifier count');
}

/**
 * Validates bracket configuration
 */
export function validateBracket(bracket: BracketStructure): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all matches have valid references
  const allMatches = [...bracket.quarterFinals, ...bracket.semiFinals, bracket.final];
  const matchIds = new Set(allMatches.map((m) => m.id));

  for (const match of allMatches) {
    if (match.nextMatchId && !matchIds.has(match.nextMatchId)) {
      errors.push(`Match ${match.id} references non-existent next match ${match.nextMatchId}`);
    }
  }

  // Check that final has no next match
  if (bracket.final.nextMatchId) {
    errors.push('Final match should not have a next match');
  }

  // Check that all non-final matches have next match
  const nonFinalMatches = [...bracket.quarterFinals, ...bracket.semiFinals];
  for (const match of nonFinalMatches) {
    if (!match.nextMatchId) {
      errors.push(`Match ${match.id} (${match.round}) missing next match reference`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats bracket for database insertion
 * Only inserts matches where both teams are known
 */
export function formatBracketForDatabase(
  bracket: BracketStructure,
  seriesIds: { quarterFinals?: string; semiFinals: string; final: string }
): Array<{
  tournament_id: string;
  series_id: string;
  team1_id: string;
  team2_id: string;
  status: 'scheduled';
  round: string;
}> {
  const matches = [];

  // Quarter-finals (only if both teams are known)
  for (const match of bracket.quarterFinals) {
    if (match.team1Id && match.team2Id) {
      matches.push({
        tournament_id: match.tournamentId,
        series_id: seriesIds.quarterFinals!,
        team1_id: match.team1Id,
        team2_id: match.team2Id,
        status: 'scheduled' as const,
        round: 'quarter-final',
      });
    }
  }

  // Semi-finals (only if both teams are known)
  for (const match of bracket.semiFinals) {
    if (match.team1Id && match.team2Id) {
      matches.push({
        tournament_id: match.tournamentId,
        series_id: seriesIds.semiFinals,
        team1_id: match.team1Id,
        team2_id: match.team2Id,
        status: 'scheduled' as const,
        round: 'semi-final',
      });
    }
  }

  // Final (only if both teams are known)
  if (bracket.final.team1Id && bracket.final.team2Id) {
    matches.push({
      tournament_id: bracket.final.tournamentId,
      series_id: seriesIds.final,
      team1_id: bracket.final.team1Id,
      team2_id: bracket.final.team2Id,
      status: 'scheduled' as const,
      round: 'final',
    });
  }

  return matches;
}

/**
 * Calculates total playoff matches needed
 */
export function calculatePlayoffMatches(qualifierCount: number): number {
  if (qualifierCount <= 2) return 1;
  if (qualifierCount <= 4) return 3; // 2 SF + 1 F
  if (qualifierCount <= 8) return 7; // 4 QF + 2 SF + 1 F
  throw new Error('Unsupported qualifier count');
}

/**
 * Helper to describe bracket structure in text
 */
export function describeBracket(bracket: BracketStructure): string {
  const parts = [];

  if (bracket.quarterFinals.length > 0) {
    parts.push(`${bracket.quarterFinals.length} cuartos de final`);
  }

  if (bracket.semiFinals.length > 0) {
    parts.push(`${bracket.semiFinals.length} semifinales`);
  }

  parts.push('1 final');

  return parts.join(', ');
}
