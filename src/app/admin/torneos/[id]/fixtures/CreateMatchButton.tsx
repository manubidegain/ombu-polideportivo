'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateMatchModal } from './CreateMatchModal';

type Series = {
  id: string;
  name: string;
  phase: string;
  category_id: string;
};

type Props = {
  tournamentId: string;
  availableSeries: Series[];
};

export function CreateMatchButton({ tournamentId, availableSeries }: Props) {
  const [showModal, setShowModal] = useState(false);

  if (availableSeries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-white/10 text-white font-heading text-[14px] py-2 px-4 rounded hover:bg-white/20 border border-white/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>CREAR PARTIDO MANUAL</span>
        </button>
      </div>

      {showModal && (
        <CreateMatchModal
          tournamentId={tournamentId}
          availableSeries={availableSeries}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
