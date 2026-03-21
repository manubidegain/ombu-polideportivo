'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type Match = {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  team1: {
    team_name: string;
  };
  team2: {
    team_name: string;
  };
  court: {
    name: string;
  } | null;
  series: {
    name: string;
    category: string;
  } | null;
};

type Props = {
  match: Match;
  tournamentId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function DeleteMatchModal({ match, tournamentId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar partido');
      }

      toast.success('Partido eliminado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting match:', error);
      toast.error(error.message || 'Error al eliminar partido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-red-500/30 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            <h2 className="font-heading text-[16px] sm:text-[20px] text-white">
              ELIMINAR PARTIDO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="font-body text-[14px] text-red-400">
              ⚠️ Esta acción es irreversible. El partido será eliminado permanentemente.
            </p>
          </div>

          {/* Match Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Partido:</p>
              <p className="font-heading text-[14px] sm:text-[16px] text-white">
                {match.team1.team_name} <span className="text-gray-400">vs</span>{' '}
                {match.team2.team_name}
              </p>
            </div>

            {match.series && (
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Serie:</p>
                <p className="font-body text-[14px] text-white">
                  {match.series.name} - {match.series.category}
                </p>
              </div>
            )}

            {match.scheduled_date && (
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Fecha y hora:</p>
                <p className="font-body text-[14px] text-white">
                  {format(parseISO(match.scheduled_date), 'd MMM yyyy', { locale: es })}
                  {match.scheduled_time && ` - ${match.scheduled_time.slice(0, 5)}`}
                </p>
              </div>
            )}

            {match.court && (
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Cancha:</p>
                <p className="font-body text-[14px] text-white">{match.court.name}</p>
              </div>
            )}
          </div>

          {/* Confirmation text */}
          <p className="font-body text-[14px] text-gray-400 text-center">
            ¿Estás seguro que querés eliminar este partido?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white/10 text-white font-heading text-[13px] sm:text-[14px] py-3 px-4 sm:px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-500/20 text-red-400 border border-red-500/50 font-heading text-[13px] sm:text-[14px] py-3 px-4 sm:px-6 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <ButtonBallSpinner />
                ELIMINANDO...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                ELIMINAR PARTIDO
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
