'use client';

import { useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  name: string;
  teams: Array<{
    id: string;
    team_name: string;
    player_names: string[];
  }>;
};

type Series = {
  id: string;
  name: string;
  series_number: number;
  category_id: string;
};

type Props = {
  tournamentId: string;
  categories: Category[];
  existingSeries: Series[];
};

export function FixtureGenerator({ tournamentId, categories, existingSeries }: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [seriesName, setSeriesName] = useState('');
  const [assignSchedule, setAssignSchedule] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  const handleGenerateFixture = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCategory) {
      setError('Selecciona una categoría');
      return;
    }

    if (selectedTeams.length < 2) {
      setError('Selecciona al menos 2 equipos');
      return;
    }

    if (!seriesName.trim()) {
      setError('Ingresa un nombre para la serie');
      return;
    }

    setLoading(true);

    try {
      // Calculate next series number for this category
      const categorySeriesCount =
        existingSeries.filter((s) => s.category_id === selectedCategory).length + 1;

      // Call API route instead of direct function
      const response = await fetch('/api/tournaments/generate-fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          categoryId: selectedCategory,
          teamIds: selectedTeams,
          seriesName,
          seriesNumber: categorySeriesCount,
          assignSchedule,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar fixture');
      }

      const result = await response.json();

      setSuccess(
        `Serie creada exitosamente con ${result.matchCount} partidos generados`
      );

      // Reset form
      setSelectedTeams([]);
      setSeriesName('');

      // Refresh page to show new matches
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al generar fixture');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h2 className="font-heading text-[24px] text-white mb-6">GENERAR FIXTURE</h2>

      <div className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="font-body text-[14px] text-white block mb-2">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedTeams([]);
            }}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.teams.length} equipos)
              </option>
            ))}
          </select>
        </div>

        {/* Team Selection */}
        {selectedCategoryData && (
          <div>
            <label className="font-body text-[14px] text-white block mb-2">
              Equipos ({selectedTeams.length} seleccionados)
            </label>
            <div className="bg-white/10 rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
              {selectedCategoryData.teams.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTeams.length === selectedCategoryData.teams.length) {
                        setSelectedTeams([]);
                      } else {
                        setSelectedTeams(selectedCategoryData.teams.map((t) => t.id));
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded bg-[#dbf228]/20 hover:bg-[#dbf228]/30 transition-colors"
                  >
                    <span className="font-body text-[14px] text-white">
                      {selectedTeams.length === selectedCategoryData.teams.length
                        ? '✓ Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </span>
                  </button>
                  {selectedCategoryData.teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeamSelection(team.id)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedTeams.includes(team.id)
                          ? 'bg-[#dbf228]/20 border border-[#dbf228]'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-body text-[14px] text-white">
                        {selectedTeams.includes(team.id) && '✓ '}
                        {team.team_name}
                      </span>
                      <p className="font-body text-[12px] text-gray-400">
                        {team.player_names.join(', ')}
                      </p>
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-center text-gray-400 py-4">
                  No hay equipos confirmados en esta categoría
                </p>
              )}
            </div>
          </div>
        )}

        {/* Series Name */}
        <div>
          <label className="font-body text-[14px] text-white block mb-2">
            Nombre de la Serie
          </label>
          <input
            type="text"
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="ej: Grupo A, Serie 1, Fase Inicial"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
        </div>

        {/* Schedule Option */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={assignSchedule}
              onChange={(e) => setAssignSchedule(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-body text-[14px] text-white">
              Asignar fechas y horarios automáticamente
            </span>
          </label>
          <p className="font-body text-[12px] text-gray-400 mt-1 ml-6">
            Si no se asignan, los partidos se crearán sin programar
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
            <p className="font-body text-[14px] text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
            <p className="font-body text-[14px] text-green-500">{success}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateFixture}
          disabled={loading || !selectedCategory || selectedTeams.length < 2}
          className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <ButtonBallSpinner />}
          {loading ? 'GENERANDO...' : 'GENERAR FIXTURE'}
        </button>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-md p-4">
          <p className="font-body text-[12px] text-blue-300">
            <strong>Cómo funciona:</strong> El generador creará un sistema de todos contra todos
            (round-robin) donde cada equipo juega contra todos los demás una vez. Si hay horarios
            configurados, se asignarán automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
