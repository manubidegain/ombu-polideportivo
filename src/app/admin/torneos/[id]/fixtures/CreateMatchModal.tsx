'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Series = {
  id: string;
  name: string;
  phase: string;
  category_id: string;
  tournament_categories?: {
    name: string;
  };
};

type Team = {
  id: string;
  team_name: string;
};

type Court = {
  id: string;
  name: string;
};

type Props = {
  tournamentId: string;
  availableSeries: Series[];
  onClose: () => void;
};

export function CreateMatchModal({ tournamentId, availableSeries, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Form state
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [courtId, setCourtId] = useState('');

  // Dynamic data
  const [teamsInSeries, setTeamsInSeries] = useState<Team[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  // Load courts on mount
  useEffect(() => {
    loadCourts();
  }, []);

  // Load teams when series changes
  useEffect(() => {
    if (selectedSeriesId) {
      loadTeamsInSeries(selectedSeriesId);
    } else {
      setTeamsInSeries([]);
      setTeam1Id('');
      setTeam2Id('');
    }
  }, [selectedSeriesId]);

  async function loadCourts() {
    try {
      const response = await fetch('/api/courts');
      const data = await response.json();
      if (response.ok) {
        setCourts(data.courts || []);
      }
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  }

  async function loadTeamsInSeries(seriesId: string) {
    setLoadingTeams(true);
    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/series/${seriesId}/teams`
      );
      const data = await response.json();

      if (response.ok) {
        setTeamsInSeries(data.teams || []);
      } else {
        toast.error(data.error || 'Error al cargar equipos');
      }
    } catch (error: any) {
      console.error('Error loading teams:', error);
      toast.error('Error al cargar equipos');
    } finally {
      setLoadingTeams(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSeriesId || !team1Id || !team2Id) {
      toast.error('Seleccioná serie y ambos equipos');
      return;
    }

    if (team1Id === team2Id) {
      toast.error('Los equipos deben ser diferentes');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/create-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: selectedSeriesId,
          team1Id,
          team2Id,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledTime || null,
          courtId: courtId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear partido');
      }

      toast.success('Partido creado exitosamente');
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear partido');
    } finally {
      setLoading(false);
    }
  }

  const selectedSeries = availableSeries.find((s) => s.id === selectedSeriesId);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Plus className="w-6 h-6 text-[#dbf228]" />
            <h2 className="font-heading text-[20px] text-white">CREAR PARTIDO MANUAL</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Series Selection */}
          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Serie / Grupo *
            </label>
            <select
              required
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="">Seleccionar serie...</option>
              {availableSeries
                .sort((a, b) => {
                  // First sort by category name
                  const catA = a.tournament_categories?.name || '';
                  const catB = b.tournament_categories?.name || '';
                  const catCompare = catA.localeCompare(catB, 'es', { numeric: true });
                  if (catCompare !== 0) return catCompare;

                  // Then sort by series name
                  return a.name.localeCompare(b.name, 'es', { numeric: true });
                })
                .map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.tournament_categories?.name || 'Sin categoría'} - {series.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Teams Selection */}
          {selectedSeriesId && (
            <>
              {loadingTeams ? (
                <div className="flex items-center justify-center py-4">
                  <ButtonBallSpinner />
                </div>
              ) : teamsInSeries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team 1 */}
                  <div>
                    <label className="block font-body text-[14px] text-white mb-2">
                      Equipo 1 *
                    </label>
                    <select
                      required
                      value={team1Id}
                      onChange={(e) => setTeam1Id(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                    >
                      <option value="">Seleccionar equipo...</option>
                      {teamsInSeries
                        .filter((team) => team.id !== team2Id)
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.team_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Team 2 */}
                  <div>
                    <label className="block font-body text-[14px] text-white mb-2">
                      Equipo 2 *
                    </label>
                    <select
                      required
                      value={team2Id}
                      onChange={(e) => setTeam2Id(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                    >
                      <option value="">Seleccionar equipo...</option>
                      {teamsInSeries
                        .filter((team) => team.id !== team1Id)
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.team_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="font-body text-[13px] text-yellow-400">
                    No hay equipos en esta serie
                  </p>
                </div>
              )}
            </>
          )}

          {/* Schedule (Optional) */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="font-heading text-[16px] text-white mb-3">
              Programación (Opcional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block font-body text-[14px] text-white mb-2">Fecha</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block font-body text-[14px] text-white mb-2">Hora</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
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
            <p className="mt-2 font-body text-[12px] text-gray-400">
              Podés dejar estos campos vacíos y asignar horarios después
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
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
              disabled={loading || !selectedSeriesId || !team1Id || !team2Id}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <ButtonBallSpinner />}
              {loading ? 'CREANDO...' : 'CREAR PARTIDO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
