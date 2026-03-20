'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Check, XCircle } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

type Match = {
  id: string;
  team1: {
    team_name: string;
    player_names: string[];
  };
  team2: {
    team_name: string;
    player_names: string[];
  };
  score?: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  };
  series: {
    category: string;
  };
};

type Props = {
  match: Match;
  onClose: () => void;
};

type Set = { team1: number; team2: number };

export function ApproveScoreModal({ match, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [sets, setSets] = useState<Set[]>(
    match.score?.sets || [
      { team1: 0, team2: 0 },
      { team1: 0, team2: 0 },
    ]
  );
  const [hasSupertiebreak, setHasSupertiebreak] = useState(
    !!match.score?.supertiebreak
  );
  const [supertiebreak, setSupertiebreak] = useState<Set>(
    match.score?.supertiebreak || { team1: 0, team2: 0 }
  );
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
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

  const handleApprove = async (editedScore?: any) => {
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/tournaments/matches/${match.id}/approve-score`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            ...(editedScore && { editedScore }),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar resultado');
      }

      toast.success('✓ Resultado aprobado correctamente');
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al aprobar resultado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor ingresá un motivo de rechazo');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/tournaments/matches/${match.id}/approve-score`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            reason: rejectionReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al rechazar resultado');
      }

      toast.success('Resultado rechazado');
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al rechazar resultado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithEdit = () => {
    const editedScore = {
      sets,
      ...(hasSupertiebreak && { supertiebreak }),
    };
    handleApprove(editedScore);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1b1b1b] border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="font-heading text-[24px] text-white mb-1">
              {rejecting ? 'RECHAZAR RESULTADO' : 'APROBAR RESULTADO'}
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
          {!rejecting ? (
            <>
              {/* Teams */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-body text-[14px] text-gray-400 mb-1">
                    Equipo 1
                  </p>
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
                  <p className="font-body text-[14px] text-gray-400 mb-1">
                    Equipo 2
                  </p>
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

              {/* Edit Toggle */}
              <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="font-body text-[14px] text-blue-300">
                  {mode === 'view'
                    ? 'Podés editar el resultado antes de aprobar'
                    : 'Estás editando el resultado'}
                </p>
                <button
                  onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                  className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white font-body text-[14px] transition-colors"
                >
                  {mode === 'view' ? 'Editar' : 'Ver Original'}
                </button>
              </div>

              {/* Sets Display/Edit */}
              <div className="space-y-3">
                <h3 className="font-heading text-[18px] text-white flex items-center justify-between">
                  SETS
                  {mode === 'edit' && (
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
                  )}
                </h3>

                {sets.map((set, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-4 grid grid-cols-3 gap-4 items-center"
                  >
                    <div>
                      <p className="font-body text-[12px] text-gray-400 mb-2">
                        {match.team1.team_name}
                      </p>
                      {mode === 'edit' ? (
                        <input
                          type="number"
                          min="0"
                          value={set.team1}
                          onChange={(e) =>
                            updateSet(idx, 'team1', parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                        />
                      ) : (
                        <div className="font-heading text-[20px] text-white text-center">
                          {set.team1}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="font-body text-[14px] text-gray-400">
                        Set {idx + 1}
                      </p>
                    </div>

                    <div>
                      <p className="font-body text-[12px] text-gray-400 mb-2">
                        {match.team2.team_name}
                      </p>
                      {mode === 'edit' ? (
                        <input
                          type="number"
                          min="0"
                          value={set.team2}
                          onChange={(e) =>
                            updateSet(idx, 'team2', parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                        />
                      ) : (
                        <div className="font-heading text-[20px] text-white text-center">
                          {set.team2}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Supertiebreak */}
              {mode === 'edit' && (
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
              )}

              {hasSupertiebreak && (
                <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-4 grid grid-cols-3 gap-4 items-center">
                  <div>
                    <p className="font-body text-[12px] text-gray-400 mb-2">
                      {match.team1.team_name}
                    </p>
                    {mode === 'edit' ? (
                      <input
                        type="number"
                        min="0"
                        value={supertiebreak.team1}
                        onChange={(e) =>
                          updateSupertiebreak(
                            'team1',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                      />
                    ) : (
                      <div className="font-heading text-[20px] text-white text-center">
                        {supertiebreak.team1}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="font-body text-[14px] text-[#dbf228]">
                      Supertiebreak
                    </p>
                  </div>

                  <div>
                    <p className="font-body text-[12px] text-gray-400 mb-2">
                      {match.team2.team_name}
                    </p>
                    {mode === 'edit' ? (
                      <input
                        type="number"
                        min="0"
                        value={supertiebreak.team2}
                        onChange={(e) =>
                          updateSupertiebreak(
                            'team2',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 font-heading text-[20px] text-white text-center focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50"
                      />
                    ) : (
                      <div className="font-heading text-[20px] text-white text-center">
                        {supertiebreak.team2}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Rejection Form */
            <div className="space-y-4">
              <div>
                <label className="block font-body text-[14px] text-white mb-2">
                  Motivo del rechazo
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explicá por qué estás rechazando este resultado..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 font-body text-[14px] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1b1b1b] border-t border-white/10 p-6 flex gap-3">
          {!rejecting ? (
            <>
              <button
                onClick={() => setRejecting(true)}
                disabled={submitting}
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-heading text-[14px] py-3 px-6 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                RECHAZAR
              </button>
              <button
                onClick={
                  mode === 'edit' ? handleApproveWithEdit : () => handleApprove()
                }
                disabled={submitting}
                className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <ButtonBallSpinner />}
                {!submitting && <Check className="w-4 h-4" />}
                {submitting
                  ? 'APROBANDO...'
                  : mode === 'edit'
                  ? 'APROBAR CON EDICIÓN'
                  : 'APROBAR'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRejecting(false)}
                disabled={submitting}
                className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 bg-red-500 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <ButtonBallSpinner />}
                {submitting ? 'RECHAZANDO...' : 'CONFIRMAR RECHAZO'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
