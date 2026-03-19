'use client';

import { useEffect, useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Trophy, TrendingUp } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {groups.map((group) => (
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
  );
}
