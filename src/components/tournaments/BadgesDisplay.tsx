import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/tournaments/achievement-definitions';

type Achievement = {
  id: string;
  achievement_type: string;
  awarded_at: string | null;
  metadata?: any;
  tournament?: {
    name: string;
    start_date: string;
  } | null;
  category?: {
    name: string;
  } | null;
};

type Props = {
  achievements: Achievement[];
  compact?: boolean;
};

export function BadgesDisplay({ achievements, compact = false }: Props) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-body text-[14px] text-gray-400">
          Todavía no has ganado logros. ¡Sigue jugando!
        </p>
      </div>
    );
  }

  // Group achievements by type
  const achievementsByType = achievements.reduce(
    (acc, achievement) => {
      const type = achievement.achievement_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );

  // Compact view: just show badge icons
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(achievementsByType).map(([type, items]) => {
          const definition = ACHIEVEMENT_DEFINITIONS[type as keyof typeof ACHIEVEMENT_DEFINITIONS];
          if (!definition) return null;

          return (
            <div
              key={type}
              className="relative group"
              title={`${definition.name} x${items.length}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23] flex items-center justify-center text-[24px] shadow-md">
                {definition.emoji}
              </div>
              {items.length > 1 && (
                <span className="absolute -top-1 -right-1 bg-[#1b1b1b] text-white text-[10px] font-heading rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {items.length}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-[#1b1b1b] text-white px-3 py-2 rounded text-[12px] whitespace-nowrap">
                  {definition.name}
                  <br />
                  <span className="text-gray-400">{definition.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view: show achievement cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => {
        const definition =
          ACHIEVEMENT_DEFINITIONS[achievement.achievement_type as keyof typeof ACHIEVEMENT_DEFINITIONS];

        if (!definition) return null;

        return (
          <div
            key={achievement.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#dbf228]/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Badge Icon */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23] flex items-center justify-center text-[32px] shadow-lg">
                {definition.emoji}
              </div>

              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-[18px] text-white mb-1">
                  {definition.name}
                </h3>
                <p className="font-body text-[12px] text-gray-400 mb-2">
                  {definition.description}
                </p>

                {/* Tournament/Category */}
                {achievement.tournament && (
                  <p className="font-body text-[11px] text-gray-500 mb-1">
                    {achievement.tournament.name}
                    {achievement.category && ` - ${achievement.category.name}`}
                  </p>
                )}

                {/* Date */}
                {achievement.awarded_at && (
                  <p className="font-body text-[10px] text-gray-600">
                    {format(new Date(achievement.awarded_at), "d MMM yyyy", { locale: es })}
                  </p>
                )}

                {/* Metadata */}
                {achievement.metadata && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    {achievement.metadata.matches_won && (
                      <p className="font-body text-[10px] text-gray-500">
                        {achievement.metadata.matches_won} partidos ganados
                      </p>
                    )}
                    {achievement.metadata.score && (
                      <p className="font-body text-[10px] text-gray-500">
                        Resultado:{' '}
                        {achievement.metadata.score
                          .map((s: any) => `${s.team1}-${s.team2}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Achievement Summary Stats Component
 */
export function AchievementStats({ achievements }: { achievements: Achievement[] }) {
  const totalAchievements = achievements.length;
  const uniqueTypes = new Set(achievements.map((a) => a.achievement_type)).size;
  const championCount = achievements.filter((a) => a.achievement_type === 'champion').length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
        <p className="font-heading text-[32px] text-[#dbf228]">{totalAchievements}</p>
        <p className="font-body text-[12px] text-gray-400">Total Logros</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
        <p className="font-heading text-[32px] text-[#dbf228]">{uniqueTypes}</p>
        <p className="font-body text-[12px] text-gray-400">Tipos Únicos</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
        <p className="font-heading text-[32px] text-[#dbf228]">{championCount}</p>
        <p className="font-body text-[12px] text-gray-400">Campeonatos</p>
      </div>
    </div>
  );
}
