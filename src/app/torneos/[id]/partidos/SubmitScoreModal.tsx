'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, AlertCircle } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

type Match = {
  id: string;
  team1: {
    id: string;
    team_name: string;
    player_names: string[];
  };
  team2: {
    id: string;
    team_name: string;
    player_names: string[];
  };
  series: {
    category: string;
  };
};

type Props = {
  match: Match;
  tournamentId: string;
  onClose: () => void;
};

type Set = { team1: number; team2: number };

export function SubmitScoreModal({ match, tournamentId, onClose }: Props) {
  const router = useRouter();
  const [sets, setSets] = useState<Set[]>([
    { team1: 0, team2: 0 },
    { team1: 0, team2: 0 },
  ]);
  const [hasSupertiebreak, setHasSupertiebreak] = useState(false);
  const [supertiebreak, setSupertiebreak] = useState<Set>({ team1: 0, team2: 0 });
  const [submitting, setSubmitting] = useState(false);

  const addSet = () => {
    if (sets.length < 3) {
      setSets([...sets, { team1: 0, team2: 0 }]);
    }
  };

  const removeSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const updateSet = (index: number, team: 'team1' | 'team2', value: number) => {
    const newSets = [...sets];
    newSets[index][team] = Math.max(0, value);
    setSets(newSets);
  };

  const updateSupertiebreak = (team: 'team1' | 'team2', value: number) => {
    setSupertiebreak({ ...supertiebreak, [team]: Math.max(0, value) });
  };

  const validateScore = () => {
    // Check if all sets have scores
    for (const set of sets) {
      if (set.team1 === 0 && set.team2 === 0) {
        return 'Todos los sets deben tener al menos un punto';
      }
    }

    // Check if there's a winner
    const setsWon = sets.reduce(
      (acc, set) => {
        if (set.team1 > set.team2) acc.team1++;
        else if (set.team2 > set.team1) acc.team2++;
        return acc;
      },
      { team1: 0, team2: 0 }
    );

    if (setsWon.team1 === 0 && setsWon.team2 === 0) {
      return 'Debe haber un ganador';
    }

    // Validate supertiebreak if enabled
    if (hasSupertiebreak) {
      if (supertiebreak.team1 === 0 && supertiebreak.team2 === 0) {
        return 'El supertiebreak debe tener puntos';
      }
      if (supertiebreak.team1 === supertiebreak.team2) {
        return 'El supertiebreak debe tener un ganador';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateScore();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/tournaments/matches/${match.id}/submit-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: {
            sets,
            ...(hasSupertiebreak && { supertiebreak }),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar resultado');
      }

      toast.success(
        '✓ Resultado enviado. Esperando aprobación del equipo rival o administrador.'
      );
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al enviar resultado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1b1b1b] border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[24px] text-white mb-1">
              CARGAR RESULTADO
            </h2>
            <p className="font-body text-[14px] text-gray-400">
              {match.series.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-[14px] text-blue-300">
                El resultado que cargues será enviado para aprobación al equipo rival
                o a un administrador. Una vez aprobado, se actualizará la tabla de
                posiciones.
              </p>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-body text-[14px] text-gray-400 mb-1">Equipo 1</p>
              <p className="font-body text-[18px] text-white font-semibold">
                {match.team1.team_name}
              </p>
              {match.team1.player_names.length > 0 && (
                <p className="font-body text-[13px] text-gray-400 mt-1">
                  {match.team1.player_names.join(' / ')}
                </p>
              )}
            </div>

            <div className="text-center">
              <span className="font-body text-[14px] text-gray-400">vs</span>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-body text-[14px] text-gray-400 mb-1">Equipo 2</p>
              <p className="font-body text-[18px] text-white font-semibold">
                {match.team2.team_name}
              </p>
              {match.team2.player_names.length > 0 && (
                <p className="font-body text-[13px] text-gray-400 mt-1">
                  {match.team2.player_names.join(' / ')}
                </p>
              )}
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-[18px] text-white">SETS</h3>
              <div className="flex gap-2">
                <button
                  onClick={removeSet}
                  disabled={sets.length <= 1}
                  className="p-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={addSet}
                  disabled={sets.length >= 3}
                  className="p-2 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {sets.map((set, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 grid grid-cols-3 gap-4 items-center"
              >
                <div>
                  <p className="font-body text-[12px] text-gray-400 mb-2">
                    {match.team1.team_name}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={set.team1}
                    onChange={(e) =>
                      updateSet(idx, 'team1', parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                  />
                </div>

                <div className="text-center">
                  <p className="font-body text-[14px] text-gray-400">Set {idx + 1}</p>
                </div>

                <div>
                  <p className="font-body text-[12px] text-gray-400 mb-2">
                    {match.team2.team_name}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={set.team2}
                    onChange={(e) =>
                      updateSet(idx, 'team2', parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Supertiebreak */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSupertiebreak}
                onChange={(e) => setHasSupertiebreak(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-[#dbf228]/50"
              />
              <span className="font-body text-[14px] text-white">
                Agregar Supertiebreak
              </span>
            </label>

            {hasSupertiebreak && (
              <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-4 grid grid-cols-3 gap-4 items-center">
                <div>
                  <p className="font-body text-[12px] text-gray-400 mb-2">
                    {match.team1.team_name}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={supertiebreak.team1}
                    onChange={(e) =>
                      updateSupertiebreak('team1', parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                  />
                </div>

                <div className="text-center">
                  <p className="font-body text-[14px] text-[#dbf228]">Supertiebreak</p>
                </div>

                <div>
                  <p className="font-body text-[12px] text-gray-400 mb-2">
                    {match.team2.team_name}
                  </p>
                  <input
                    type="number"
                    min="0"
                    value={supertiebreak.team2}
                    onChange={(e) =>
                      updateSupertiebreak('team2', parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1b1b1b] border-t border-white/10 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <ButtonBallSpinner />}
            {submitting ? 'ENVIANDO...' : 'ENVIAR RESULTADO'}
          </button>
        </div>
      </div>
    </div>
  );
}
