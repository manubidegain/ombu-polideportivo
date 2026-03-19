'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { X } from 'lucide-react';
import { toast } from 'sonner';

type Series = {
  id: string;
  name: string;
  team_count: number;
  currentTeamCount?: number;
};

type Props = {
  registrationId: string;
  teamName: string;
  currentSeriesId: string | null;
  availableSeries: Series[];
  onClose: () => void;
};

export function ChangeSeriesModal({
  registrationId,
  teamName,
  currentSeriesId,
  availableSeries,
  onClose,
}: Props) {
  const router = useRouter();
  const [selectedSeriesId, setSelectedSeriesId] = useState(currentSeriesId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSeriesId) {
      toast.error('Seleccioná una serie');
      return;
    }

    if (selectedSeriesId === currentSeriesId) {
      onClose();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/tournament-registration/update-series', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          newSeriesId: selectedSeriesId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar serie');
      }

      toast.success('Serie cambiada exitosamente');
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-heading text-[20px] text-white">CAMBIAR SERIE</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="font-body text-[14px] text-gray-400 mb-4">
              Equipo: <span className="text-white font-semibold">{teamName}</span>
            </p>
            <p className="font-body text-[12px] text-yellow-400 mb-4">
              ⚠️ Al cambiar de serie, se eliminarán los partidos del equipo en la serie actual y se regenerarán en la nueva serie.
            </p>
          </div>

          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Nueva Serie *
            </label>
            <select
              required
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="">Seleccionar serie...</option>
              {availableSeries.map((series) => {
                const isCurrent = series.id === currentSeriesId;
                const teamCount = series.currentTeamCount || 0;

                return (
                  <option key={series.id} value={series.id}>
                    {series.name}
                    {isCurrent ? ' (Actual)' : ''}
                    {` (${teamCount} equipos)`}
                  </option>
                );
              })}
            </select>
            <p className="mt-2 font-body text-[12px] text-gray-400">
              Los partidos se regenerarán automáticamente en ambas series
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSeriesId || selectedSeriesId === currentSeriesId}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <ButtonBallSpinner />}
              {loading ? 'CAMBIANDO...' : 'CAMBIAR SERIE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
