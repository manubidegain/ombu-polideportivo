'use client';

import { useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Set = {
  team1: number;
  team2: number;
};

type Props = {
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Id: string;
  team2Id: string;
  setsToWin: number;
  gamesPerSet: number;
  tiebreakPoints: number;
  seriesId?: string;
  isAdmin?: boolean;
};

export function ResultEntry({
  matchId,
  team1Name,
  team2Name,
  team1Id,
  team2Id,
  setsToWin,
  gamesPerSet,
  tiebreakPoints,
  seriesId,
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const [sets, setSets] = useState<Set[]>([{ team1: 0, team2: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSet = () => {
    if (sets.length < setsToWin * 2 - 1) {
      setSets([...sets, { team1: 0, team2: 0 }]);
    }
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const updateSetScore = (index: number, team: 'team1' | 'team2', value: string) => {
    const numValue = parseInt(value) || 0;
    const newSets = [...sets];
    newSets[index][team] = numValue;
    setSets(newSets);
  };

  const validateScore = (): string | null => {
    // Count sets won by each team
    let team1Sets = 0;
    let team2Sets = 0;

    for (const set of sets) {
      if (set.team1 > set.team2) team1Sets++;
      else if (set.team2 > set.team1) team2Sets++;
    }

    // Check if a team has won the required sets
    if (team1Sets < setsToWin && team2Sets < setsToWin) {
      return 'Ningún equipo ha ganado suficientes sets';
    }

    // Validate each set
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      const diff = Math.abs(set.team1 - set.team2);

      // Check if set has a winner
      if (set.team1 === set.team2) {
        return `Set ${i + 1}: No puede haber empate`;
      }

      // Check minimum games difference (must win by 2, or reach tiebreak)
      const maxGames = Math.max(set.team1, set.team2);
      const minGames = Math.min(set.team1, set.team2);

      // Standard set: must win by 2 or reach tiebreak at games_per_set-games_per_set
      if (maxGames === gamesPerSet && minGames === gamesPerSet - 1) {
        return `Set ${i + 1}: Debe ganarse por 2 juegos o ir a tiebreak (${gamesPerSet}-${gamesPerSet})`;
      }

      // Normal win: must win by at least 2
      if (maxGames < gamesPerSet && diff < 2) {
        return `Set ${i + 1}: Debe ganarse por al menos 2 juegos`;
      }

      // Tiebreak: exactly games_per_set to games_per_set
      if (minGames === gamesPerSet && maxGames !== gamesPerSet + 1) {
        return `Set ${i + 1}: Tiebreak inválido`;
      }

      // Extended play: can't go beyond games_per_set + 1
      if (maxGames > gamesPerSet + 1) {
        return `Set ${i + 1}: Puntuación inválida`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setError(null);

    const validationError = validateScore();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Count sets won
      let team1Sets = 0;
      let team2Sets = 0;

      for (const set of sets) {
        if (set.team1 > set.team2) team1Sets++;
        else if (set.team2 > set.team1) team2Sets++;
      }

      const winnerId = team1Sets > team2Sets ? team1Id : team2Id;

      // Update match
      const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          score: { sets },
          winner_id: winnerId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Update standings if series exists
      if (seriesId) {
        // Get current standings
        const { data: standings } = await supabase
          .from('tournament_series_teams')
          .select('*')
          .eq('series_id', seriesId)
          .in('registration_id', [team1Id, team2Id]);

        if (standings) {
          // Calculate games won/lost
          let team1Games = 0;
          let team2Games = 0;
          for (const set of sets) {
            team1Games += set.team1;
            team2Games += set.team2;
          }

          // Update winner
          const winnerStanding = standings.find((s) => s.registration_id === winnerId);
          if (winnerStanding) {
            await supabase
              .from('tournament_series_teams')
              .update({
                matches_played: (winnerStanding.matches_played || 0) + 1,
                matches_won: (winnerStanding.matches_won || 0) + 1,
                points: (winnerStanding.points || 0) + 3,
                sets_won: (winnerStanding.sets_won || 0) + (winnerId === team1Id ? team1Sets : team2Sets),
                sets_lost:
                  (winnerStanding.sets_lost || 0) + (winnerId === team1Id ? team2Sets : team1Sets),
                games_won:
                  (winnerStanding.games_won || 0) + (winnerId === team1Id ? team1Games : team2Games),
                games_lost:
                  (winnerStanding.games_lost || 0) + (winnerId === team1Id ? team2Games : team1Games),
              })
              .eq('id', winnerStanding.id);
          }

          // Update loser
          const loserId = winnerId === team1Id ? team2Id : team1Id;
          const loserStanding = standings.find((s) => s.registration_id === loserId);
          if (loserStanding) {
            await supabase
              .from('tournament_series_teams')
              .update({
                matches_played: (loserStanding.matches_played || 0) + 1,
                matches_lost: (loserStanding.matches_lost || 0) + 1,
                points: (loserStanding.points || 0) + 1,
                sets_won: (loserStanding.sets_won || 0) + (loserId === team1Id ? team1Sets : team2Sets),
                sets_lost: (loserStanding.sets_lost || 0) + (loserId === team1Id ? team2Sets : team1Sets),
                games_won: (loserStanding.games_won || 0) + (loserId === team1Id ? team1Games : team2Games),
                games_lost:
                  (loserStanding.games_lost || 0) + (loserId === team1Id ? team2Games : team1Games),
              })
              .eq('id', loserStanding.id);
          }
        }
      }

      // Check and award achievements (async, don't wait for it)
      fetch('/api/achievements/check-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      }).catch((err) => console.error('Error checking achievements:', err));

      // Redirect based on user type
      if (isAdmin) {
        router.push(`/admin/torneos/${matchId.split('-')[0]}`);
      } else {
        router.push('/mis-torneos');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sets */}
      {sets.map((set, index) => (
        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="font-heading text-[18px] text-white mb-4">SET {index + 1}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-[14px] text-white block mb-2">
                {team1Name}
              </label>
              <input
                type="number"
                min="0"
                max={gamesPerSet + 1}
                value={set.team1}
                onChange={(e) => updateSetScore(index, 'team1', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-heading text-[24px] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>

            <div>
              <label className="font-body text-[14px] text-white block mb-2">
                {team2Name}
              </label>
              <input
                type="number"
                min="0"
                max={gamesPerSet + 1}
                value={set.team2}
                onChange={(e) => updateSetScore(index, 'team2', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-heading text-[24px] text-black text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add/Remove Set Buttons */}
      <div className="flex gap-4">
        <button
          onClick={addSet}
          disabled={sets.length >= setsToWin * 2 - 1}
          className="flex-1 bg-white/10 text-white border border-white/20 font-heading text-[14px] py-2 px-4 rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + AGREGAR SET
        </button>
        {sets.length > 1 && (
          <button
            onClick={removeLastSet}
            className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-heading text-[14px] py-2 px-4 rounded hover:bg-red-500/20 transition-colors"
          >
            - ELIMINAR SET
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
          <p className="font-body text-[14px] text-red-500">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-md p-4">
        <p className="font-body text-[12px] text-blue-300">
          <strong>Reglas:</strong> Cada set debe ganarse por al menos 2 juegos. Si el marcador llega
          a {gamesPerSet}-{gamesPerSet}, se juega un tiebreak. El partido se gana al mejor de{' '}
          {setsToWin * 2 - 1} sets (primero en ganar {setsToWin} sets).
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <ButtonBallSpinner />}
        {loading ? 'GUARDANDO...' : 'GUARDAR RESULTADO'}
      </button>
    </div>
  );
}
