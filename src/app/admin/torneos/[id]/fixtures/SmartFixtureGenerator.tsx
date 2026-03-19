'use client';

import { useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { Play, Settings, Users, Info } from 'lucide-react';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  teams: Array<{
    id: string;
    team_name: string;
    player_names: string[];
  }>;
};

type Props = {
  tournamentId: string;
  categories: Category[];
};

export function SmartFixtureGenerator({ tournamentId, categories }: Props) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customGroups, setCustomGroups] = useState<string>('');

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const teamCount = selectedCategory?.teams.length || 0;

  // Calculate suggested configuration
  const getSuggestedConfig = (count: number): number[] => {
    if (count < 3) return [];
    if (count <= 4) return [count];
    if (count % 3 === 0) return Array(count / 3).fill(3);
    if (count % 4 === 0) return Array(count / 4).fill(4);

    const groupsOf3 = Math.floor(count / 3);
    const remainder = count % 3;

    if (remainder === 1) {
      if (groupsOf3 === 1) return [4];
      return [...Array(groupsOf3 - 1).fill(3), 4];
    } else if (remainder === 2) {
      if (groupsOf3 === 1) return [5];
      return [...Array(groupsOf3 - 2).fill(3), 4, 4];
    }

    return Array(groupsOf3).fill(3);
  };

  const suggested = getSuggestedConfig(teamCount);
  const customParsed = customGroups
    .split(',')
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n) && n >= 3);

  const activeGroups = customParsed.length > 0 ? customParsed : suggested;

  const totalMatches = activeGroups.reduce(
    (sum, count) => sum + (count * (count - 1)) / 2,
    0
  );

  const handleGenerate = async () => {
    if (!selectedCategoryId) {
      toast.error('Seleccioná una categoría');
      return;
    }

    if (teamCount < 3) {
      toast.error('Se necesitan al menos 3 equipos inscritos');
      return;
    }

    const totalTeams = activeGroups.reduce((sum, count) => sum + count, 0);
    if (totalTeams !== teamCount) {
      toast.error(
        `La configuración de grupos no coincide: ${totalTeams} equipos en grupos vs ${teamCount} equipos inscritos`
      );
      return;
    }

    setGenerating(true);

    try {
      const teamIds = selectedCategory!.teams.map((t) => t.id);

      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/generate-groups`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            teamIds,
            teamsPerGroup: customParsed.length > 0 ? customParsed : undefined,
            distributionMethod: 'snake',
            assignSchedule: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar fixture');
      }

      toast.success(
        `✓ Fixture generado: ${data.groupCount} grupos, ${data.totalMatches} partidos`
      );

      // Reset
      setSelectedCategoryId('');
      setCustomGroups('');

      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al generar fixture');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-[24px] text-white mb-1">GENERAR FIXTURE</h2>
          <p className="font-body text-[14px] text-gray-400">
            Sistema inteligente de grupos + playoffs
          </p>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="font-body text-[14px]">
            {showAdvanced ? 'Simple' : 'Avanzado'}
          </span>
        </button>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block font-body text-[12px] text-gray-400 mb-2">
          CATEGORÍA *
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setCustomGroups('');
          }}
          className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
        >
          <option value="">Seleccionar categoría...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.teams.length} equipos)
            </option>
          ))}
        </select>
      </div>

      {selectedCategoryId && teamCount > 0 && (
        <>
          {/* Configuration Preview */}
          <div className="bg-white/5 border border-white/10 rounded p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-[#dbf228]" />
              <h3 className="font-heading text-[16px] text-white">CONFIGURACIÓN</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Equipos</p>
                <p className="font-body text-[20px] text-white">{teamCount}</p>
              </div>
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Grupos</p>
                <p className="font-body text-[20px] text-white">{activeGroups.length || '-'}</p>
              </div>
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Distribución</p>
                <p className="font-body text-[14px] text-white">
                  {activeGroups.length > 0 ? activeGroups.join(' - ') : '-'}
                </p>
              </div>
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Partidos</p>
                <p className="font-body text-[20px] text-[#dbf228]">{totalMatches || '-'}</p>
              </div>
            </div>

            {showAdvanced && (
              <div className="border-t border-white/10 pt-4">
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  CONFIGURACIÓN MANUAL
                </label>
                <input
                  type="text"
                  placeholder="Ej: 3,3,4 para 3 grupos de 3, 3 y 4 equipos"
                  value={customGroups}
                  onChange={(e) => setCustomGroups(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
                />
                <p className="font-body text-[11px] text-gray-500 mt-2">
                  Dejá vacío para usar configuración automática óptima
                </p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-6 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-[13px] text-blue-300 mb-2">
                <strong>Cómo funciona:</strong>
              </p>
              <ul className="font-body text-[12px] text-blue-300/80 space-y-1">
                <li>• Crea grupos de mínimo 3 equipos</li>
                <li>• Round-robin dentro de cada grupo (todos vs todos)</li>
                <li>• Asigna horarios respetando restricciones de equipos</li>
                <li>• Luego podrás generar playoffs con los mejores de cada grupo</li>
              </ul>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || teamCount < 3}
            className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {generating ? (
              <>
                <ButtonBallSpinner />
                <span>GENERANDO...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>GENERAR GRUPOS Y PARTIDOS</span>
              </>
            )}
          </button>
        </>
      )}

      {selectedCategoryId && teamCount === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 text-center">
          <p className="font-body text-[14px] text-yellow-400">
            No hay equipos confirmados en esta categoría
          </p>
        </div>
      )}
    </div>
  );
}
