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
