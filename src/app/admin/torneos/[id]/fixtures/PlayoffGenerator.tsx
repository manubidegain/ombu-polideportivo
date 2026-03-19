'use client';

import { useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Award, Info } from 'lucide-react';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
};

type Props = {
  tournamentId: string;
  categories: Category[];
};

type QualificationRule = 'top1' | 'top2' | 'top1-best2nds' | 'top1-top2';

export function PlayoffGenerator({ tournamentId, categories }: Props) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [qualificationRule, setQualificationRule] = useState<QualificationRule>('top2');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const qualificationOptions: Array<{ value: QualificationRule; label: string; description: string }> = [
    { value: 'top1', label: 'Top 1 por grupo', description: 'Solo el 1º de cada grupo' },
    { value: 'top2', label: 'Top 2 por grupo', description: '1º y 2º de cada grupo' },
    { value: 'top1-best2nds', label: 'Top 1 + mejores 2dos', description: '1º de cada grupo + mejores 2dos' },
    { value: 'top1-top2', label: 'Top 1 y Top 2', description: 'Combinación de 1ros y 2dos' },
  ];

  const handlePreview = async () => {
    if (!selectedCategoryId || !qualificationRule) {
      toast.error('Seleccioná una categoría y regla de clasificación');
      return;
    }

    setLoadingPreview(true);

    try {
      // Check if groups are complete by fetching standings
      const standingsResponse = await fetch(
        `/api/admin/tournaments/${tournamentId}/standings?categoryId=${selectedCategoryId}`
      );
      const standingsData = await standingsResponse.json();

      if (!standingsResponse.ok) {
        throw new Error(standingsData.error || 'Error al cargar standings');
      }

      const groups = standingsData.groups || [];
      const allComplete = groups.every((g: any) => g.isComplete);

      if (!allComplete) {
        toast.error('No todos los grupos están completos. Completá todos los partidos primero.');
        setLoadingPreview(false);
        return;
      }

      // Calculate preview
      const totalGroups = groups.length;
      let qualifierCount = 0;

      if (qualificationRule === 'top1') {
        qualifierCount = totalGroups;
      } else if (qualificationRule === 'top2') {
        qualifierCount = totalGroups * 2;
      } else if (qualificationRule === 'top1-best2nds') {
        const remaining = 8 - totalGroups; // Assuming max 8 bracket
        qualifierCount = totalGroups + Math.min(remaining, totalGroups);
      } else {
        qualifierCount = totalGroups * 2;
      }

      const bracketInfo = calculateBracketStructure(qualifierCount);

      setPreviewData({
        groups: totalGroups,
        qualifiers: qualifierCount,
        ...bracketInfo,
      });
    } catch (error: any) {
      console.error('Error loading preview:', error);
      toast.error(error.message || 'Error al cargar preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const calculateBracketStructure = (qualifierCount: number) => {
    if (qualifierCount <= 2) {
      return {
        hasQuarterFinals: false,
        hasSemiFinals: false,
        totalMatches: 1,
        structure: 'Final directa',
      };
    }

    if (qualifierCount <= 4) {
      return {
        hasQuarterFinals: false,
        hasSemiFinals: true,
        totalMatches: 3,
        structure: '2 semifinales + final',
      };
    }

    if (qualifierCount <= 8) {
      return {
        hasQuarterFinals: true,
        hasSemiFinals: true,
        totalMatches: 7,
        structure: '4 cuartos + 2 semis + final',
      };
    }

    return {
      hasQuarterFinals: true,
      hasSemiFinals: true,
      totalMatches: 7,
      structure: 'Máximo 8 equipos',
    };
  };

  const handleGenerate = async () => {
    if (!selectedCategoryId || !qualificationRule) {
      toast.error('Seleccioná una categoría y regla de clasificación');
      return;
    }

    if (!previewData) {
      toast.error('Cargá el preview primero');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/generate-playoffs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            qualificationRule,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar playoffs');
      }

      toast.success(
        `✓ Playoffs generados: ${data.qualifierCount} equipos, ${data.totalMatches} partidos`
      );

      // Reset
      setSelectedCategoryId('');
      setQualificationRule('top2');
      setPreviewData(null);

      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al generar playoffs');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-[#dbf228]" />
        <div>
          <h2 className="font-heading text-[24px] text-white mb-1">GENERAR PLAYOFFS</h2>
          <p className="font-body text-[14px] text-gray-400">
            Crear cuadro de eliminación directa
          </p>
        </div>
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
            setPreviewData(null);
          }}
          className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
        >
          <option value="">Seleccionar categoría...</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Qualification Rule */}
      <div className="mb-6">
        <label className="block font-body text-[12px] text-gray-400 mb-3">
          REGLA DE CLASIFICACIÓN *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qualificationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setQualificationRule(option.value);
                setPreviewData(null);
              }}
              className={`p-4 rounded border-2 transition-all text-left ${
                qualificationRule === option.value
                  ? 'border-[#dbf228] bg-[#dbf228]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-[14px] text-white">
                  {option.label}
                </span>
                {qualificationRule === option.value && (
                  <Award className="w-4 h-4 text-[#dbf228]" />
                )}
              </div>
              <p className="font-body text-[12px] text-gray-400">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview Button */}
      <button
        onClick={handlePreview}
        disabled={loadingPreview || !selectedCategoryId || !qualificationRule}
        className="w-full mb-6 bg-white/10 text-white font-body text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loadingPreview ? (
          <>
            <ButtonBallSpinner />
            <span>CARGANDO PREVIEW...</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4" />
            <span>VER PREVIEW</span>
          </>
        )}
      </button>

      {/* Preview Panel */}
      {previewData && (
        <div className="bg-white/5 border border-white/10 rounded p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-[#dbf228]" />
            <h3 className="font-heading text-[16px] text-white">PREVIEW DEL BRACKET</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Grupos</p>
              <p className="font-body text-[20px] text-white">{previewData.groups}</p>
            </div>
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Clasificados</p>
              <p className="font-body text-[20px] text-[#dbf228]">{previewData.qualifiers}</p>
            </div>
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Estructura</p>
              <p className="font-body text-[14px] text-white">{previewData.structure}</p>
            </div>
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Total Partidos</p>
              <p className="font-body text-[20px] text-white">{previewData.totalMatches}</p>
            </div>
          </div>

          {previewData.qualifiers > 8 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              <p className="font-body text-[12px] text-yellow-400">
                ⚠️ Máximo 8 equipos soportados actualmente. Solo los primeros 8 clasificarán.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-[13px] text-blue-300 mb-2">
            <strong>Requisitos:</strong>
          </p>
          <ul className="font-body text-[12px] text-blue-300/80 space-y-1">
            <li>• Todos los partidos de grupos deben estar completos</li>
            <li>• El sistema asigna seeds automáticamente: 1ros de grupo primero, luego 2dos</li>
            <li>• Bracket estándar: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5</li>
            <li>• Solo se crean los partidos con equipos conocidos (no los que esperan ganadores)</li>
          </ul>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !previewData}
        className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {generating ? (
          <>
            <ButtonBallSpinner />
            <span>GENERANDO PLAYOFFS...</span>
          </>
        ) : (
          <>
            <Trophy className="w-5 h-5" />
            <span>GENERAR PLAYOFFS</span>
          </>
        )}
      </button>
    </div>
  );
}
