'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Tables } from '@/types/database.types';
import { TournamentStatusBadge } from './TournamentStatusBadge';

type Tournament = Tables<'tournaments'> & {
  registrations_count: number;
};

interface TournamentsListProps {
  tournaments: Tournament[];
}

export function TournamentsList({ tournaments }: TournamentsListProps) {

  if (tournaments.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No hay torneos creados todavía
        </p>
        <Link
          href="/admin/torneos/nuevo"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded hover:bg-[#c5db23] transition-colors"
        >
          CREAR PRIMER TORNEO
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {tournaments.map((tournament) => (
        <Link
          key={tournament.id}
          href={`/admin/torneos/${tournament.id}`}
          className="block bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="font-heading text-[24px] text-white">{tournament.name}</h2>
                <TournamentStatusBadge status={tournament.status} />
              </div>
              {tournament.description && (
                <p className="font-body text-[14px] text-gray-400 mb-4">
                  {tournament.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-body text-[12px] text-gray-400">Deporte</p>
              <p className="font-body text-[16px] text-white capitalize">
                {tournament.sport_type}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Fecha Inicio</p>
              <p className="font-body text-[16px] text-white">
                {format(new Date(tournament.start_date), 'd MMM yyyy', { locale: es })}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Inscriptos</p>
              <p className="font-body text-[16px] text-white">
                {tournament.registrations_count} equipos
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Precio</p>
              <p className="font-body text-[16px] text-white">${tournament.registration_price}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-6 text-[12px] text-gray-400">
              <span>Sets: {tournament.sets_to_win}</span>
              <span>Games: {tournament.games_per_set}</span>
              <span>Tiebreak: {tournament.tiebreak_points} pts</span>
              <span>Duración: {tournament.match_duration_minutes} min</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
