'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  tournamentId: string;
  categoryId: string;
  categoryName: string;
  hasMatches: boolean;
};

export function GenerateMatchesButton({
  tournamentId,
  categoryId,
  categoryName,
  hasMatches,
}: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/generate-matches`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            assignSchedule: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar partidos');
      }

      toast.success(
        `✓ ${data.totalMatches} partidos generados (${data.totalScheduled} con horario asignado)`
      );

      setShowConfirm(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al generar partidos');
    } finally {
      setGenerating(false);
    }
  };

  if (hasMatches) {
    return null; // Don't show if series already have matches
  }

  return (
    <>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-[18px] sm:text-[20px] text-white mb-1">
              PASO 2: GENERAR PARTIDOS
            </h3>
            <p className="font-body text-[13px] sm:text-[14px] text-gray-400">
              Las series están listas. Ahora podés generar los partidos round-robin o crearlos manualmente.
            </p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={generating}
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] sm:text-[16px] py-2 sm:py-3 px-4 sm:px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <Play className="w-4 h-4" />
            <span>GENERAR PARTIDOS</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full p-6">
            <h3 className="font-heading text-[20px] text-white mb-4">
              CONFIRMAR GENERACIÓN DE PARTIDOS
            </h3>
            <p className="font-body text-[14px] text-gray-300 mb-2">
              Se generarán partidos round-robin (todos contra todos) para todas las series de{' '}
              <span className="text-white font-bold">{categoryName}</span>.
            </p>
            <p className="font-body text-[13px] text-yellow-400 mb-6">
              ⚠️ Los partidos se generarán automáticamente con horarios asignados respetando las restricciones de disponibilidad de los equipos.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={generating}
                className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating && <ButtonBallSpinner />}
                {generating ? 'GENERANDO...' : 'GENERAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
