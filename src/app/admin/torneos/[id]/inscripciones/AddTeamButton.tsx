'use client';

import { useState } from 'react';
import { AddTeamForm } from './AddTeamForm';
import { Plus } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  max_teams: number;
  registrations_count?: number;
};

type Props = {
  tournamentId: string;
  categories: Category[];
};

export function AddTeamButton({ tournamentId, categories }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] sm:text-[16px] py-2 sm:py-3 px-4 sm:px-6 rounded hover:bg-[#c5db23] transition-colors"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        AGREGAR PAREJA
      </button>

      {showForm && (
        <AddTeamForm
          tournamentId={tournamentId}
          categories={categories}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
