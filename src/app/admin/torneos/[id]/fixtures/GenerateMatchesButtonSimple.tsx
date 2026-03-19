'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { GenerateMatchesModal } from './GenerateMatchesModal';

type Category = {
  id: string;
  name: string;
  hasMatches: boolean;
};

type Props = {
  tournamentId: string;
  categories: Category[];
};

export function GenerateMatchesButtonSimple({ tournamentId, categories }: Props) {
  const [showModal, setShowModal] = useState(false);

  // Only show if there are categories without matches
  const hasCategoriesToGenerate = categories.some(c => !c.hasMatches);

  if (!hasCategoriesToGenerate) {
    return null;
  }

  return (
    <>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-heading text-[18px] sm:text-[20px] text-white mb-1">
              PASO 2: GENERAR PARTIDOS
            </h3>
            <p className="font-body text-[13px] sm:text-[14px] text-gray-400">
              Las series están listas. Ahora podés generar los partidos round-robin o crearlos manualmente.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] sm:text-[16px] py-2 sm:py-3 px-4 sm:px-6 rounded hover:bg-[#c5db23] transition-colors flex items-center gap-2 whitespace-nowrap min-w-fit"
          >
            <Play className="w-4 h-4" />
            <span>GENERAR PARTIDOS</span>
          </button>
        </div>
      </div>

      {showModal && (
        <GenerateMatchesModal
          tournamentId={tournamentId}
          categories={categories}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
