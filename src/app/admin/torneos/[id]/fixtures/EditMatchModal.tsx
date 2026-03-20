'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type Match = {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  court: {
    name: string;
  } | null;
  team1: {
    id: string;
    team_name: string;
  };
  team2: {
    id: string;
    team_name: string;
  };
};

type Court = {
  id: string;
  name: string;
};

type Props = {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditMatchModal({ match, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);

  // Form state
  const [scheduledDate, setScheduledDate] = useState(match.scheduled_date || '');
  const [scheduledTime, setScheduledTime] = useState(match.scheduled_time || '');
  const [courtId, setCourtId] = useState('');

  // Load courts on mount
  useEffect(() => {
    loadCourts();
  }, []);

  async function loadCourts() {
    try {
      const response = await fetch('/api/courts');
      const data = await response.json();
      if (response.ok) {
        setCourts(data.courts || []);
        // Find current court ID if exists
        if (match.court) {
          const currentCourt = data.courts.find((c: Court) => c.name === match.court?.name);
          if (currentCourt) {
            setCourtId(currentCourt.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/tournaments/matches/${match.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledTime || null,
          courtId: courtId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar partido');
      }

      toast.success('Partido actualizado exitosamente');
      router.refresh();
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al actualizar partido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#dbf228]" />
            <h2 className="font-heading text-[16px] sm:text-[20px] text-white">EDITAR PARTIDO</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Match Info */}
          <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
            <p className="font-body text-[12px] sm:text-[14px] text-gray-400 mb-2">Partido:</p>
            <p className="font-heading text-[14px] sm:text-[16px] text-white">
              {match.team1.team_name} <span className="text-gray-400">vs</span> {match.team2.team_name}
            </p>
          </div>

          {/* Schedule Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block font-body text-[14px] text-white mb-2">Fecha</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228] scheme-dark"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block font-body text-[14px] text-white mb-2">Hora</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228] scheme-dark"
              />
            </div>

            {/* Court */}
            <div>
              <label className="block font-body text-[14px] text-white mb-2">Cancha</label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              >
                <option value="">Sin asignar</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="font-body text-[11px] sm:text-[12px] text-gray-400">
            Dejá los campos vacíos si querés eliminar la programación
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white/10 text-white font-heading text-[13px] sm:text-[14px] py-3 px-4 sm:px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[13px] sm:text-[14px] py-3 px-4 sm:px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <ButtonBallSpinner />}
              {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
