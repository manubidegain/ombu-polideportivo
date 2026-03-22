/**
 * Playoff Rules System
 *
 * Defines automatic playoff structures based on team count.
 * These rules determine how many teams qualify from groups and
 * what playoff rounds are needed.
 */

export type PlayoffStructure = {
  teamCount: number;
  groupStructure: string; // e.g., "2 series de 3"
  qualificationRule: 'top1' | 'top2' | 'top1-best2nds' | 'custom';
  customQualifiers?: number; // For custom rules
  rounds: PlayoffRound[];
  description: string;
  supported: boolean;
  errorMessage?: string;
};

export type PlayoffRound = {
  name: string; // "Octavos", "Cuartos", "Semifinales", "Final"
  matchCount: number;
  qualifiersNeeded: number; // How many teams needed for this round
  note?: string; // Additional explanation
};

/**
 * Get the recommended playoff structure for a given team count
 */
export function getPlayoffStructure(teamCount: number): PlayoffStructure {
  switch (teamCount) {
    case 4:
      return {
        teamCount: 4,
        groupStructure: '1 serie de 4',
        qualificationRule: 'top2',
        rounds: [
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Final directa entre 1° y 2°',
        supported: true
      };

    case 5:
      return {
        teamCount: 5,
        groupStructure: '1 serie de 5',
        qualificationRule: 'top2',
        rounds: [
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Final directa entre 1° y 2°',
        supported: true
      };

    case 6:
      return {
        teamCount: 6,
        groupStructure: '2 series de 3',
        qualificationRule: 'top2',
        rounds: [
          {
            name: 'Semis',
            matchCount: 2,
            qualifiersNeeded: 4,
            note: '1°A vs 2°B, 1°B vs 2°A'
          },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Semifinales cruzadas (1° vs 2° del otro grupo) → Final',
        supported: true
      };

    case 7:
      return {
        teamCount: 7,
        groupStructure: '1 serie de 3 y 1 serie de 4',
        qualificationRule: 'top2',
        rounds: [
          {
            name: 'Semis',
            matchCount: 2,
            qualifiersNeeded: 4,
            note: '1° vs 2° cruzados'
          },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Semifinales cruzadas → Final',
        supported: true
      };

    case 8:
      return {
        teamCount: 8,
        groupStructure: '2 series de 4',
        qualificationRule: 'custom',
        customQualifiers: 6, // 2 primeros + 2 segundos + 2 terceros (pero solo 2 terceros juegan cuartos)
        rounds: [
          {
            name: 'Cuartos',
            matchCount: 2,
            qualifiersNeeded: 4,
            note: '2°A vs 3°B, 2°B vs 3°A'
          },
          {
            name: 'Semis',
            matchCount: 2,
            qualifiersNeeded: 4,
            note: '1°A vs ganador QF, 1°B vs ganador QF'
          },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Los primeros esperan en semifinales. Segundos y terceros juegan cuartos.',
        supported: true
      };

    case 9:
      return {
        teamCount: 9,
        groupStructure: '3 series de 3',
        qualificationRule: 'custom',
        customQualifiers: 9, // All teams: 3 primeros + 3 segundos + 3 terceros
        rounds: [
          {
            name: 'Octavos',
            matchCount: 2,
            qualifiersNeeded: 8,
            note: 'Mejor 2° vs Mejor 3°, 2° segundo vs 2° tercero'
          },
          {
            name: 'Cuarto',
            matchCount: 1,
            qualifiersNeeded: 2,
            note: 'Ganador Oct1 vs Ganador Oct2 → define 4° semifinalista'
          },
          {
            name: 'Semis',
            matchCount: 2,
            qualifiersNeeded: 4,
            note: 'Los 3 primeros esperan + ganador del cuarto'
          },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Los 3 primeros esperan en semifinales. Segundos y terceros disputan el 4° lugar mediante octavos y cuarto.',
        supported: false,
        errorMessage: 'Estructura de 9 equipos definida pero aún no implementada en el generador de brackets. Próximamente disponible.'
      };

    case 12:
      return {
        teamCount: 12,
        groupStructure: '4 series de 3',
        qualificationRule: 'top2',
        rounds: [
          {
            name: 'Cuartos',
            matchCount: 4,
            qualifiersNeeded: 8,
            note: 'Todos los primeros y segundos'
          },
          { name: 'Semis', matchCount: 2, qualifiersNeeded: 4 },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Cuartos de Final (primeros y segundos) → Semifinales → Final',
        supported: false,
        errorMessage: 'Estructura de 12 equipos definida pero aún no implementada en el generador de brackets. Próximamente disponible.'
      };

    case 15:
      return {
        teamCount: 15,
        groupStructure: '5 series de 3',
        qualificationRule: 'custom',
        customQualifiers: 10, // 5 primeros + 5 segundos
        rounds: [
          {
            name: 'Octavos',
            matchCount: 2,
            qualifiersNeeded: 8,
            note: 'Los 4 segundos no clasificados directos juegan por 2 lugares'
          },
          {
            name: 'Cuartos',
            matchCount: 4,
            qualifiersNeeded: 8,
            note: '5 primeros + mejor segundo + 2 ganadores de octavos'
          },
          { name: 'Semis', matchCount: 2, qualifiersNeeded: 4 },
          { name: 'Final', matchCount: 1, qualifiersNeeded: 2 }
        ],
        description: 'Los 5 primeros + mejor segundo pasan directo a cuartos. Los otros 4 segundos juegan octavos.',
        supported: false,
        errorMessage: 'Estructura de 15 equipos definida pero aún no implementada en el generador de brackets. Próximamente disponible.'
      };

    // Unsupported cases
    case 10:
    case 11:
    case 13:
    case 14:
      return {
        teamCount,
        groupStructure: 'No definida',
        qualificationRule: 'top1',
        rounds: [],
        description: '',
        supported: false,
        errorMessage: `No hay una estructura de playoffs definida para ${teamCount} equipos. Por favor usá configuración manual.`
      };

    default:
      if (teamCount < 4) {
        return {
          teamCount,
          groupStructure: 'No aplicable',
          qualificationRule: 'top1',
          rounds: [],
          description: '',
          supported: false,
          errorMessage: `Se necesitan al menos 4 equipos para generar playoffs. Actualmente hay ${teamCount}.`
        };
      } else if (teamCount > 16) {
        return {
          teamCount,
          groupStructure: 'No definida',
          qualificationRule: 'top1',
          rounds: [],
          description: '',
          supported: false,
          errorMessage: `No hay una estructura de playoffs definida para más de 16 equipos. Actualmente hay ${teamCount}.`
        };
      }

      return {
        teamCount,
        groupStructure: 'No definida',
        qualificationRule: 'top1',
        rounds: [],
        description: '',
        supported: false,
        errorMessage: `No hay una estructura de playoffs definida para ${teamCount} equipos.`
      };
  }
}

/**
 * Get a human-readable summary of the playoff structure
 */
export function getPlayoffSummary(structure: PlayoffStructure): string {
  if (!structure.supported) {
    return structure.errorMessage || 'Estructura no soportada';
  }

  const roundNames = structure.rounds.map(r => r.name).join(' → ');
  return `${structure.teamCount} equipos (${structure.groupStructure}): ${roundNames}`;
}

/**
 * Validate if a team count is supported for automatic playoff generation
 */
export function isTeamCountSupported(teamCount: number): boolean {
  const structure = getPlayoffStructure(teamCount);
  return structure.supported;
}

/**
 * Get all supported team counts (currently implemented in bracket generator)
 */
export function getSupportedTeamCounts(): number[] {
  return [4, 5, 6, 7, 8];
}

/**
 * Get team counts with defined rules (including not yet implemented)
 */
export function getDefinedTeamCounts(): number[] {
  return [4, 5, 6, 7, 8, 9, 12, 15];
}
