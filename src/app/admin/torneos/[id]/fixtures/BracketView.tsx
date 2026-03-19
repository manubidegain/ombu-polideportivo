'use client';

import { useEffect, useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Trophy, Award, Medal } from 'lucide-react';

type Match = {
  id: string;
  team1_id: string | null;
  team2_id: string | null;
  winner_id: string | null;
  team1?: {
    team_name: string;
  } | null;
  team2?: {
    team_name: string;
  } | null;
  score?: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  };
  series?: {
    name: string;
    phase: string;
  } | null;
};

type Props = {
  tournamentId: string;
  categoryId?: string;
};

export function BracketView({ tournamentId, categoryId }: Props) {
  const [loading, setLoading] = useState(true);
  const [quarterFinals, setQuarterFinals] = useState<Match[]>([]);
  const [semiFinals, setSemiFinals] = useState<Match[]>([]);
  const [final, setFinal] = useState<Match | null>(null);

  useEffect(() => {
    loadBracket();
  }, [tournamentId, categoryId]);

  async function loadBracket() {
    setLoading(true);

    try {
      const url = categoryId
        ? `/api/admin/tournaments/${tournamentId}/playoff-matches?categoryId=${categoryId}`
        : `/api/admin/tournaments/${tournamentId}/playoff-matches`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setQuarterFinals(data.quarterFinals || []);
        setSemiFinals(data.semiFinals || []);
        setFinal(data.final || null);
      }
    } catch (err) {
      console.error('Error loading bracket:', err);
    } finally {
      setLoading(false);
    }
  }

  const renderMatch = (match: Match, roundLabel: string, icon?: React.ReactNode) => {
    const hasTeams = match.team1_id && match.team2_id;
    const isCompleted = match.winner_id !== null;

    return (
      <div
        key={match.id}
        className={`bg-white/5 border rounded-lg p-4 ${
          isCompleted
            ? 'border-green-500/30'
            : hasTeams
            ? 'border-white/10'
            : 'border-white/5'
        }`}
      >
        {/* Round Label */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          {icon}
          <span className="font-body text-[11px] text-gray-400 uppercase">
            {roundLabel}
          </span>
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {/* Team 1 */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded ${
              match.winner_id === match.team1_id
                ? 'bg-[#dbf228]/20 border border-[#dbf228]/50'
                : 'bg-white/5'
            }`}
          >
            <span className="font-body text-[13px] text-white">
              {match.team1?.team_name || 'TBD'}
            </span>
            {isCompleted && match.score && (
              <span className="font-body text-[12px] text-gray-400">
                {match.score.sets.map((s) => s.team1).join(', ')}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded ${
              match.winner_id === match.team2_id
                ? 'bg-[#dbf228]/20 border border-[#dbf228]/50'
                : 'bg-white/5'
            }`}
          >
            <span className="font-body text-[13px] text-white">
              {match.team2?.team_name || 'TBD'}
            </span>
            {isCompleted && match.score && (
              <span className="font-body text-[12px] text-gray-400">
                {match.score.sets.map((s) => s.team2).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        {!hasTeams && (
          <p className="font-body text-[11px] text-gray-500 mt-2 text-center">
            Esperando ganadores...
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <ButtonBallSpinner />
        </div>
      </div>
    );
  }

  if (!quarterFinals.length && !semiFinals.length && !final) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
        <p className="font-body text-[14px] text-gray-400">
          No hay playoffs generados todavía
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-[#dbf228]" />
        <h2 className="font-heading text-[24px] text-white">BRACKET DE PLAYOFFS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quarter Finals */}
        {quarterFinals.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-heading text-[16px] text-white mb-3 flex items-center gap-2">
              <Medal className="w-5 h-5 text-orange-400" />
              CUARTOS DE FINAL
            </h3>
            {quarterFinals.map((match, idx) =>
              renderMatch(match, `QF ${idx + 1}`, <Medal className="w-3 h-3 text-orange-400" />)
            )}
          </div>
        )}

        {/* Semi Finals */}
        {semiFinals.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-heading text-[16px] text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              SEMIFINALES
            </h3>
            {semiFinals.map((match, idx) =>
              renderMatch(match, `SF ${idx + 1}`, <Award className="w-3 h-3 text-blue-400" />)
            )}
          </div>
        )}

        {/* Final */}
        {final && (
          <div className="space-y-4">
            <h3 className="font-heading text-[16px] text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#dbf228]" />
              FINAL
            </h3>
            {renderMatch(final, 'FINAL', <Trophy className="w-3 h-3 text-[#dbf228]" />)}
          </div>
        )}
      </div>
    </div>
  );
}
