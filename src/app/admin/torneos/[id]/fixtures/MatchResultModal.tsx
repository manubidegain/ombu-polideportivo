'use client';

import { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

type Match = {
  id: string;
  team1: {
    id: string;
    team_name: string;
  };
  team2: {
    id: string;
    team_name: string;
  };
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  score?: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  };
};

type Props = {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
};

export function MatchResultModal({ match, onClose, onSuccess }: Props) {
  const existingScore = match.score;

  const [set1Team1, setSet1Team1] = useState(existingScore?.sets[0]?.team1?.toString() || '');
  const [set1Team2, setSet1Team2] = useState(existingScore?.sets[0]?.team2?.toString() || '');
  const [set2Team1, setSet2Team1] = useState(existingScore?.sets[1]?.team1?.toString() || '');
  const [set2Team2, setSet2Team2] = useState(existingScore?.sets[1]?.team2?.toString() || '');

  const [superTieTeam1, setSuperTieTeam1] = useState(existingScore?.supertiebreak?.team1?.toString() || '');
  const [superTieTeam2, setSuperTieTeam2] = useState(existingScore?.supertiebreak?.team2?.toString() || '');

  const [saving, setSaving] = useState(false);

  // Calculate if supertiebreak is needed (sets are 1-1)
  const set1Winner = parseInt(set1Team1) > parseInt(set1Team2) ? 1 : parseInt(set1Team2) > parseInt(set1Team1) ? 2 : 0;
  const set2Winner = parseInt(set2Team1) > parseInt(set2Team2) ? 1 : parseInt(set2Team2) > parseInt(set2Team1) ? 2 : 0;

  const needsSuperTie = set1Winner > 0 && set2Winner > 0 && set1Winner !== set2Winner;

  // Calculate winner
  const getWinner = (): string | null => {
    if (!set1Team1 || !set1Team2 || !set2Team1 || !set2Team2) return null;

    const team1Sets = (set1Winner === 1 ? 1 : 0) + (set2Winner === 1 ? 1 : 0);
    const team2Sets = (set1Winner === 2 ? 1 : 0) + (set2Winner === 2 ? 1 : 0);

    // If sets are 2-0 or 0-2, we have a winner
    if (team1Sets === 2) return match.team1.id;
    if (team2Sets === 2) return match.team2.id;

    // If sets are 1-1, check supertiebreak
    if (needsSuperTie && superTieTeam1 && superTieTeam2) {
      if (parseInt(superTieTeam1) > parseInt(superTieTeam2)) return match.team1.id;
      if (parseInt(superTieTeam2) > parseInt(superTieTeam1)) return match.team2.id;
    }

    return null;
  };

  const winnerId = getWinner();

  const handleSave = async () => {
    if (!winnerId) {
      toast.error('Completá todos los campos necesarios para determinar un ganador');
      return;
    }

    setSaving(true);

    try {
      const scoreData = {
        sets: [
          { team1: parseInt(set1Team1), team2: parseInt(set1Team2) },
          { team1: parseInt(set2Team1), team2: parseInt(set2Team2) },
        ],
        ...(needsSuperTie && superTieTeam1 && superTieTeam2
          ? {
              supertiebreak: {
                team1: parseInt(superTieTeam1),
                team2: parseInt(superTieTeam2),
              },
            }
          : {}),
      };

      const response = await fetch(`/api/admin/tournaments/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: scoreData,
          winnerId,
          status: 'completed',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar resultado');
      }

      toast.success('Resultado guardado correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving result:', error);
      toast.error(error.message || 'Error al guardar resultado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-heading text-[24px] text-white">CARGAR RESULTADO</h2>
            <p className="font-body text-[12px] text-gray-400 mt-1">
              {match.scheduled_date} {match.scheduled_time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Teams */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <p className="font-body text-[12px] text-gray-400 mb-2">EQUIPO 1</p>
              <p className="font-body text-[18px] text-white">{match.team1.team_name}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded p-4">
              <p className="font-body text-[12px] text-gray-400 mb-2">EQUIPO 2</p>
              <p className="font-body text-[18px] text-white">{match.team2.team_name}</p>
            </div>
          </div>

          {/* Set 1 */}
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-3">SET 1 *</label>
            <div className="grid grid-cols-3 gap-4 items-center">
              <input
                type="number"
                min="0"
                value={set1Team1}
                onChange={(e) => setSet1Team1(e.target.value)}
                placeholder="0"
                className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
              />
              <div className="text-center font-body text-[14px] text-gray-400">vs</div>
              <input
                type="number"
                min="0"
                value={set1Team2}
                onChange={(e) => setSet1Team2(e.target.value)}
                placeholder="0"
                className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
              />
            </div>
          </div>

          {/* Set 2 */}
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-3">SET 2 *</label>
            <div className="grid grid-cols-3 gap-4 items-center">
              <input
                type="number"
                min="0"
                value={set2Team1}
                onChange={(e) => setSet2Team1(e.target.value)}
                placeholder="0"
                className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
              />
              <div className="text-center font-body text-[14px] text-gray-400">vs</div>
              <input
                type="number"
                min="0"
                value={set2Team2}
                onChange={(e) => setSet2Team2(e.target.value)}
                placeholder="0"
                className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
              />
            </div>
          </div>

          {/* Supertiebreak (conditional) */}
          {needsSuperTie && (
            <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded p-4">
              <label className="block font-body text-[12px] text-[#dbf228] mb-3">
                SUPERTIEBREAK (Sets empatados 1-1) *
              </label>
              <div className="grid grid-cols-3 gap-4 items-center">
                <input
                  type="number"
                  min="0"
                  value={superTieTeam1}
                  onChange={(e) => setSuperTieTeam1(e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
                />
                <div className="text-center font-body text-[14px] text-gray-400">vs</div>
                <input
                  type="number"
                  min="0"
                  value={superTieTeam2}
                  onChange={(e) => setSuperTieTeam2(e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[16px] text-center focus:outline-none focus:border-[#dbf228]"
                />
              </div>
            </div>
          )}

          {/* Winner Preview */}
          {winnerId && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-4 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-body text-[12px] text-green-400 mb-1">GANADOR</p>
                <p className="font-body text-[16px] text-white">
                  {winnerId === match.team1.id ? match.team1.team_name : match.team2.team_name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white font-body text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !winnerId}
            className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <ButtonBallSpinner />
                <span>GUARDANDO...</span>
              </>
            ) : (
              'GUARDAR RESULTADO'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
