'use client';

import { useEffect, useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Trophy, TrendingUp, ArrowRightLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { ChangeSeriesModal } from './ChangeSeriesModal';

type TeamStanding = {
  position: number;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
};

type GroupStanding = {
  seriesId: string;
  groupName: string;
  categoryName: string;
  phase: string;
  standings: TeamStanding[];
  totalMatches: number;
  completedMatches: number;
  completionPercentage: number;
  isComplete: boolean;
};

type Props = {
  tournamentId: string;
  categoryId?: string;
};

export function GroupStandings({ tournamentId, categoryId }: Props) {
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [changingTeam, setChangingTeam] = useState<{
    teamId: string;
    teamName: string;
    currentSeriesId: string;
  } | null>(null);

  const toggleCategory = (categoryName: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryName)) {
      newCollapsed.delete(categoryName);
    } else {
      newCollapsed.add(categoryName);
    }
    setCollapsedCategories(newCollapsed);
  };

  useEffect(() => {
    loadStandings();
  }, [tournamentId, categoryId]);

  async function loadStandings() {
    setLoading(true);
    setError(null);

    try {
      const url = categoryId
        ? `/api/admin/tournaments/${tournamentId}/standings?categoryId=${categoryId}`
        : `/api/admin/tournaments/${tournamentId}/standings`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar standings');
      }

      setGroups(data.groups || []);
    } catch (err: any) {
      console.error('Error loading standings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <ButtonBallSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
        <p className="font-body text-[14px] text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
        <p className="font-body text-[14px] text-gray-400">
          No hay grupos generados todavía
        </p>
      </div>
    );
  }

  // Group by category
  const groupsByCategory = groups.reduce((acc, group) => {
    const category = group.categoryName || 'Sin Categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(group);
    return acc;
  }, {} as Record<string, GroupStanding[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupsByCategory).map(([categoryName, categoryGroups]) => (
        <div key={categoryName} className="space-y-4">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(categoryName)}
            className="w-full bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-4 hover:bg-[#dbf228]/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[22px] text-[#dbf228]">
                {categoryName}
              </h2>
              <div className="flex items-center gap-3">
                <span className="font-body text-[14px] text-gray-400">
                  {categoryGroups.length} {categoryGroups.length === 1 ? 'serie' : 'series'}
                </span>
                {collapsedCategories.has(categoryName) ? (
                  <ChevronRight className="w-5 h-5 text-[#dbf228]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#dbf228]" />
                )}
              </div>
            </div>
          </button>

          {/* Category Groups */}
          {!collapsedCategories.has(categoryName) && (
            <div className="space-y-4">
              {categoryGroups.map((group) => (
                <div
                  key={group.seriesId}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-[20px] text-white mb-1">
                          {group.groupName}
                        </h3>
                        <p className="font-body text-[12px] text-gray-400">
                          {group.completedMatches} / {group.totalMatches} partidos completados
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#dbf228] transition-all"
                              style={{ width: `${group.completionPercentage}%` }}
                            />
                          </div>
                          <span className="font-body text-[12px] text-gray-400">
                            {group.completionPercentage}%
                          </span>
                        </div>

                        {/* Complete Badge */}
                        {group.isComplete && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-body text-[12px]">
                            <Trophy className="w-3 h-3" />
                            Completo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Standings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left font-body text-[12px] text-gray-400 px-6 py-3">
                            POS
                          </th>
                          <th className="text-left font-body text-[12px] text-gray-400 px-6 py-3">
                            EQUIPO
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            PJ
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            PG
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            PP
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            SETS
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            GAMES
                          </th>
                          <th className="text-center font-body text-[12px] text-gray-400 px-3 py-3">
                            ACCIONES
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.standings.map((team) => (
                          <tr
                            key={team.teamId}
                            className={`border-b border-white/5 ${
                              team.position === 1
                                ? 'bg-[#dbf228]/10'
                                : team.position === 2
                                ? 'bg-white/5'
                                : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-heading text-[16px] text-white">
                                  {team.position}
                                </span>
                                {team.position === 1 && (
                                  <TrendingUp className="w-4 h-4 text-[#dbf228]" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-body text-[14px] text-white">
                                {team.teamName}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <span className="font-body text-[14px] text-gray-300">
                                {team.matchesPlayed}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <span className="font-body text-[14px] text-green-400">
                                {team.matchesWon}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <span className="font-body text-[14px] text-red-400">
                                {team.matchesLost}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <span className="font-body text-[12px] text-gray-300">
                                {team.setsWon}-{team.setsLost}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <span className="font-body text-[12px] text-gray-300">
                                {team.gamesWon}-{team.gamesLost}
                              </span>
                            </td>
                            <td className="text-center px-3 py-4">
                              <button
                                onClick={() =>
                                  setChangingTeam({
                                    teamId: team.teamId,
                                    teamName: team.teamName,
                                    currentSeriesId: group.seriesId,
                                  })
                                }
                                className="p-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="Cambiar serie"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="px-6 py-3 bg-white/5 border-t border-white/10">
                    <p className="font-body text-[11px] text-gray-500">
                      PJ: Partidos Jugados | PG: Partidos Ganados | PP: Partidos Perdidos |
                      Ranking: Sets → Games → Head-to-Head
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Change Series Modal */}
      {changingTeam && (
        <ChangeSeriesModal
          registrationId={changingTeam.teamId}
          teamName={changingTeam.teamName}
          currentSeriesId={changingTeam.currentSeriesId}
          availableSeries={groups.map((g) => ({
            id: g.seriesId,
            name: g.groupName,
            categoryName: g.categoryName,
            team_count: g.standings.length,
            currentTeamCount: g.standings.length,
          }))}
          onClose={() => {
            setChangingTeam(null);
            loadStandings(); // Reload standings after change
          }}
        />
      )}
    </div>
  );
}
