'use client';

import { GroupStandings } from './GroupStandings';

type Props = {
  tournamentId: string;
};

export function StandingsTab({ tournamentId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="font-heading text-[20px] sm:text-[24px] text-white mb-2">
            TABLA DE POSICIONES
          </h2>
          <p className="font-body text-[14px] text-gray-400">
            Posiciones actualizadas según los resultados de los partidos
          </p>
        </div>
        <GroupStandings tournamentId={tournamentId} />
      </div>
    </div>
  );
}
