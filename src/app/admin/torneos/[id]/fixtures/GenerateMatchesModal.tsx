'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { X, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  hasMatches: boolean;
};

type Props = {
  tournamentId: string;
  categories: Category[];
  onClose: () => void;
};

export function GenerateMatchesModal({ tournamentId, categories, onClose }: Props) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const availableCategories = categories.filter(c => !c.hasMatches);

  const toggleCategory = (categoryId: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategories(newSelection);
  };

  const selectAll = () => {
    setSelectedCategories(new Set(availableCategories.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedCategories(new Set());
  };

  const handleGenerate = async () => {
    if (selectedCategories.size === 0) {
      toast.error('Seleccioná al menos una categoría');
      return;
    }

    setGenerating(true);

    try {
      let totalMatches = 0;
      let totalScheduled = 0;

      // Generate matches for each selected category
      for (const categoryId of Array.from(selectedCategories)) {
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

        totalMatches += data.totalMatches || 0;
        totalScheduled += data.totalScheduled || 0;
      }

      toast.success(
        `✓ ${totalMatches} partidos generados (${totalScheduled} con horario asignado)`
      );

      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al generar partidos');
    } finally {
      setGenerating(false);
    }
  };

  if (availableCategories.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Play className="w-6 h-6 text-[#dbf228]" />
            <h2 className="font-heading text-[20px] text-white">GENERAR PARTIDOS</h2>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="font-body text-[14px] text-gray-300">
            Seleccioná las categorías para generar partidos round-robin:
          </p>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              disabled={generating}
              className="font-body text-[12px] text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              Seleccionar todas
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={deselectAll}
              disabled={generating}
              className="font-body text-[12px] text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              Deseleccionar todas
            </button>
          </div>

          {/* Categories list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {availableCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                disabled={generating}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors disabled:opacity-50 ${
                  selectedCategories.has(category.id)
                    ? 'bg-[#dbf228]/10 border-[#dbf228]/30 hover:bg-[#dbf228]/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="font-body text-[14px] text-white">
                  {category.name}
                </span>
                {selectedCategories.has(category.id) && (
                  <CheckCircle2 className="w-5 h-5 text-[#dbf228]" />
                )}
              </button>
            ))}
          </div>

          <p className="font-body text-[12px] text-yellow-400">
            ⚠️ Los partidos se generarán con horarios automáticos respetando disponibilidad de equipos.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={generating}
            className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || selectedCategories.size === 0}
            className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating && <ButtonBallSpinner />}
            {generating ? 'GENERANDO...' : `GENERAR (${selectedCategories.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
