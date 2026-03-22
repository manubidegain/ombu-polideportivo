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
  round: 'round-of-16' | 'quarter-final' | 'semi-final' | 'final';
  matchNumber: number; // Within the round
  nextMatchId: string | null; // Winner advances to this match
  bracketPosition: number; // For UI rendering
};

export type BracketStructure = {
  roundOf16: PlayoffMatch[]; // Octavos de final
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
 * Supports: 2-8 teams (standard), 9 teams, 12 teams, 15 teams
 */
export function generatePlayoffBracket(
  tournamentId: string,
  categoryId: string,
  seededQualifiers: TeamStats[]
): BracketStructure {
  const qualifierCount = seededQualifiers.length;

  let matchIdCounter = 1;
  const roundOf16: PlayoffMatch[] = [];
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

  // 2-5 teams: Direct final
  if (qualifierCount <= 2) {
    final = createMatch('final', 1, seededQualifiers[0].teamId, seededQualifiers[1].teamId, 1);
    return { roundOf16: [], quarterFinals: [], semiFinals: [], final, totalMatches: 1 };
  }

  // 3-6 teams: Semis + Final (crossed semifinals)
  if (qualifierCount <= 6) {
    // For 3-4: sf1 = 1 vs 4, sf2 = 2 vs 3
    // For 5-6: sf1 = 1 vs 4, sf2 = 2 vs 3 (seeds 5-6 are null)
    const sf1 = createMatch('semi-final', 1, seededQualifiers[0]?.teamId || null, seededQualifiers[3]?.teamId || null, 1);
    const sf2 = createMatch('semi-final', 2, seededQualifiers[1]?.teamId || null, seededQualifiers[2]?.teamId || null, 2);
    final = createMatch('final', 1, null, null, 1);

    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;
    semiFinals.push(sf1, sf2);

    return { roundOf16: [], quarterFinals: [], semiFinals, final, totalMatches: 3 };
  }

  // 7-8 teams: Cuartos + Semis + Final (standard bracket)
  if (qualifierCount <= 8) {
    const seeds = Array(8).fill(null).map((_, i) => seededQualifiers[i]?.teamId || null);

    const qf1 = createMatch('quarter-final', 1, seeds[0], seeds[7], 1);
    const qf2 = createMatch('quarter-final', 2, seeds[3], seeds[4], 2);
    const qf3 = createMatch('quarter-final', 3, seeds[1], seeds[6], 3);
    const qf4 = createMatch('quarter-final', 4, seeds[2], seeds[5], 4);

    const sf1 = createMatch('semi-final', 1, null, null, 1);
    const sf2 = createMatch('semi-final', 2, null, null, 2);
    final = createMatch('final', 1, null, null, 1);

    qf1.nextMatchId = sf1.id;
    qf2.nextMatchId = sf1.id;
    qf3.nextMatchId = sf2.id;
    qf4.nextMatchId = sf2.id;
    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    quarterFinals.push(qf1, qf2, qf3, qf4);
    semiFinals.push(sf1, sf2);

    return { roundOf16: [], quarterFinals, semiFinals, final, totalMatches: 7 };
  }

  // 7 qualifiers from 9 teams (3 groups of 3): 3 primeros + 3 segundos + mejor tercero
  // Primeros esperan en semis, mejor 2° vs mejor 3° (oct1), otros dos segundos juegan oct2
  // Ganadores de octavos juegan cuarto, ganador de cuarto vs 3er primero en semi
  if (qualifierCount === 7) {
    // Octavos: 2 matches
    const oct1 = createMatch('round-of-16', 1, seededQualifiers[3]?.teamId || null, seededQualifiers[6]?.teamId || null, 1); // Mejor 2° vs Mejor 3°
    const oct2 = createMatch('round-of-16', 2, seededQualifiers[4]?.teamId || null, seededQualifiers[5]?.teamId || null, 2); // 2° segundo vs 3° segundo

    // Cuarto: 1 match - ganadores de octavos
    const qf = createMatch('quarter-final', 1, null, null, 1);
    oct1.nextMatchId = qf.id;
    oct2.nextMatchId = qf.id;

    // Semis: 3 primeros + ganador de cuarto
    const sf1 = createMatch('semi-final', 1, seededQualifiers[0]?.teamId || null, null, 1); // 1er primero vs ganador cuarto
    const sf2 = createMatch('semi-final', 2, seededQualifiers[1]?.teamId || null, seededQualifiers[2]?.teamId || null, 2); // 2° primero vs 3er primero
    qf.nextMatchId = sf1.id;

    final = createMatch('final', 1, null, null, 1);
    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    roundOf16.push(oct1, oct2);
    quarterFinals.push(qf);
    semiFinals.push(sf1, sf2);

    return { roundOf16, quarterFinals, semiFinals, final, totalMatches: 6 };
  }

  // 12 teams: 4 groups of 3
  // Todos los primeros y segundos a cuartos (8 teams)
  if (qualifierCount === 12) {
    // Cuartos: standard 8-team bracket
    const qf1 = createMatch('quarter-final', 1, seededQualifiers[0]?.teamId || null, seededQualifiers[7]?.teamId || null, 1); // 1°A vs 2°D
    const qf2 = createMatch('quarter-final', 2, seededQualifiers[3]?.teamId || null, seededQualifiers[4]?.teamId || null, 2); // 1°D vs 2°A
    const qf3 = createMatch('quarter-final', 3, seededQualifiers[1]?.teamId || null, seededQualifiers[6]?.teamId || null, 3); // 1°B vs 2°C
    const qf4 = createMatch('quarter-final', 4, seededQualifiers[2]?.teamId || null, seededQualifiers[5]?.teamId || null, 4); // 1°C vs 2°B

    const sf1 = createMatch('semi-final', 1, null, null, 1);
    const sf2 = createMatch('semi-final', 2, null, null, 2);
    final = createMatch('final', 1, null, null, 1);

    qf1.nextMatchId = sf1.id;
    qf2.nextMatchId = sf1.id;
    qf3.nextMatchId = sf2.id;
    qf4.nextMatchId = sf2.id;
    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    quarterFinals.push(qf1, qf2, qf3, qf4);
    semiFinals.push(sf1, sf2);

    return { roundOf16: [], quarterFinals, semiFinals, final, totalMatches: 7 };
  }

  // 15 teams: 5 groups of 3
  // 5 primeros + mejor segundo a cuartos, otros 4 segundos juegan octavos
  if (qualifierCount === 15) {
    // Octavos: 2 matches entre los 4 segundos peores
    const oct1 = createMatch('round-of-16', 1, seededQualifiers[6]?.teamId || null, seededQualifiers[9]?.teamId || null, 1); // 2° segundo vs 5° segundo
    const oct2 = createMatch('round-of-16', 2, seededQualifiers[7]?.teamId || null, seededQualifiers[8]?.teamId || null, 2); // 3° segundo vs 4° segundo

    // Cuartos: 5 primeros + mejor segundo + 2 ganadores de octavos
    const qf1 = createMatch('quarter-final', 1, seededQualifiers[0]?.teamId || null, null, 1); // 1° primero vs ganador oct1
    const qf2 = createMatch('quarter-final', 2, seededQualifiers[3]?.teamId || null, seededQualifiers[4]?.teamId || null, 2); // 4° primero vs 5° primero
    const qf3 = createMatch('quarter-final', 3, seededQualifiers[1]?.teamId || null, null, 3); // 2° primero vs ganador oct2
    const qf4 = createMatch('quarter-final', 4, seededQualifiers[2]?.teamId || null, seededQualifiers[5]?.teamId || null, 4); // 3° primero vs mejor segundo

    oct1.nextMatchId = qf1.id;
    oct2.nextMatchId = qf3.id;

    const sf1 = createMatch('semi-final', 1, null, null, 1);
    const sf2 = createMatch('semi-final', 2, null, null, 2);
    final = createMatch('final', 1, null, null, 1);

    qf1.nextMatchId = sf1.id;
    qf2.nextMatchId = sf1.id;
    qf3.nextMatchId = sf2.id;
    qf4.nextMatchId = sf2.id;
    sf1.nextMatchId = final.id;
    sf2.nextMatchId = final.id;

    roundOf16.push(oct1, oct2);
    quarterFinals.push(qf1, qf2, qf3, qf4);
    semiFinals.push(sf1, sf2);

    return { roundOf16, quarterFinals, semiFinals, final, totalMatches: 9 };
  }

  throw new Error(`Estructura de playoffs no soportada para ${qualifierCount} equipos`);
}

/**
 * Validates bracket configuration
 */
export function validateBracket(bracket: BracketStructure): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all matches have valid references
  const allMatches = [...bracket.roundOf16, ...bracket.quarterFinals, ...bracket.semiFinals, bracket.final];
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
  const nonFinalMatches = [...bracket.roundOf16, ...bracket.quarterFinals, ...bracket.semiFinals];
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
  seriesIds: { roundOf16?: string; quarterFinals?: string; semiFinals: string; final: string }
): Array<{
  tournament_id: string;
  series_id: string;
  team1_id: string;
  team2_id: string;
  status: 'scheduled';
  round: string;
}> {
  const matches = [];

  // Round of 16 / Octavos (only if both teams are known)
  if (seriesIds.roundOf16) {
    for (const match of bracket.roundOf16) {
      if (match.team1Id && match.team2Id) {
        matches.push({
          tournament_id: match.tournamentId,
          series_id: seriesIds.roundOf16,
          team1_id: match.team1Id,
          team2_id: match.team2Id,
          status: 'scheduled' as const,
          round: 'round-of-16',
        });
      }
    }
  }

  // Quarter-finals (only if both teams are known)
  if (seriesIds.quarterFinals) {
    for (const match of bracket.quarterFinals) {
      if (match.team1Id && match.team2Id) {
        matches.push({
          tournament_id: match.tournamentId,
          series_id: seriesIds.quarterFinals,
          team1_id: match.team1Id,
          team2_id: match.team2Id,
          status: 'scheduled' as const,
          round: 'quarter-final',
        });
      }
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
  if (qualifierCount <= 6) return 3; // 2 SF + 1 F
  if (qualifierCount === 7) return 6; // 2 Oct + 1 QF + 2 SF + 1 F (9 teams → 7 qualifiers)
  if (qualifierCount === 8) return 7; // 4 QF + 2 SF + 1 F
  if (qualifierCount === 12) return 7; // 4 QF + 2 SF + 1 F
  if (qualifierCount === 15) return 9; // 2 Oct + 4 QF + 2 SF + 1 F
  throw new Error('Unsupported qualifier count');
}

/**
 * Helper to describe bracket structure in text
 */
export function describeBracket(bracket: BracketStructure): string {
  const parts = [];

  if (bracket.roundOf16.length > 0) {
    parts.push(`${bracket.roundOf16.length} octavos de final`);
  }

  if (bracket.quarterFinals.length > 0) {
    parts.push(`${bracket.quarterFinals.length} cuartos de final`);
  }

  if (bracket.semiFinals.length > 0) {
    parts.push(`${bracket.semiFinals.length} semifinales`);
  }

  parts.push('1 final');

  return parts.join(', ');
}
