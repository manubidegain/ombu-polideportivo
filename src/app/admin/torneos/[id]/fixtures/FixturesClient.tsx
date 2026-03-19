'use client';

import { useRouter } from 'next/navigation';
import { MatchesList } from './MatchesList';

type Match = {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  team1: {
    id: string;
    team_name: string;
  };
  team2: {
    id: string;
    team_name: string;
  };
  court: {
    name: string;
  } | null;
  series: {
    name: string;
    phase: string;
    category: string;
  } | null;
  score?: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  };
};

type Props = {
  matches: Match[];
};

export function FixturesClient({ matches }: Props) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h2 className="font-heading text-[24px] text-white mb-6">
        PARTIDOS GENERADOS ({matches?.length || 0})
      </h2>

      {matches && matches.length > 0 ? (
        <MatchesList matches={matches} onUpdate={handleUpdate} />
      ) : (
        <p className="text-center text-gray-400 py-8">
          No se han generado partidos todavía. Usa el generador de fixture arriba para crear series
          y partidos.
        </p>
      )}
    </div>
  );
}
