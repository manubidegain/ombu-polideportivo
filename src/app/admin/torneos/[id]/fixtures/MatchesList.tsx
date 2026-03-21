'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Edit, Settings, Trash2 } from 'lucide-react';
import { MatchResultModal } from './MatchResultModal';
import { EditMatchModal } from './EditMatchModal';
import { DeleteMatchModal } from './DeleteMatchModal';

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
  tournamentId: string;
  onUpdate?: () => void;
};

export function MatchesList({ matches, tournamentId, onUpdate }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      walkover: 'bg-gray-500/20 text-gray-400',
    };
    const labels = {
      scheduled: 'Programado',
      in_progress: 'En Juego',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
      walkover: 'W.O.',
    };
    const statusKey = status as keyof typeof badges;
    return (
      <span
        className={`px-2 py-1 rounded font-body text-[12px] ${badges[statusKey] || badges.scheduled}`}
      >
        {labels[statusKey] || status}
      </span>
    );
  };

  // Group matches by category first, then by series
  const matchesByCategory = matches.reduce(
    (acc, match) => {
      const category = match.series?.category || 'Sin Categoría';
      const seriesName = match.series?.name || 'Sin Serie';

      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][seriesName]) {
        acc[category][seriesName] = [];
      }
      acc[category][seriesName].push(match);
      return acc;
    },
    {} as Record<string, Record<string, Match[]>>
  );

  // Sort categories alphabetically
  const sortedCategories = Object.entries(matchesByCategory).sort(([a], [b]) =>
    a.localeCompare(b, 'es', { numeric: true })
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {sortedCategories.map(([categoryName, seriesGroups]) => (
        <div key={categoryName} className="space-y-3 sm:space-y-4">
          {/* Category Header */}
          <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-3 sm:p-4">
            <h2 className="font-heading text-[18px] sm:text-[22px] text-[#dbf228]">
              {categoryName}
            </h2>
          </div>

          {/* Series within category */}
          {Object.entries(seriesGroups).map(([seriesName, seriesMatches]) => (
            <div key={seriesName} className="ml-0 sm:ml-4">
              <h3 className="font-heading text-[16px] sm:text-[18px] text-white mb-2 sm:mb-3 pb-2 border-b border-white/10">
                {seriesName}
              </h3>
              <div className="space-y-2">
                {seriesMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-[#dbf228]/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Teams */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="font-body text-[14px] sm:text-[16px] text-white">
                        {match.team1.team_name}
                      </span>
                      <span className="font-body text-[12px] sm:text-[14px] text-gray-400">vs</span>
                      <span className="font-body text-[14px] sm:text-[16px] text-white">
                        {match.team2.team_name}
                      </span>
                    </div>

                    {/* Match Details */}
                    <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 mt-2 text-gray-400">
                      {match.scheduled_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="font-body text-[11px] sm:text-[12px]">
                            {format(parseISO(match.scheduled_date), "d MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="font-body text-[11px] sm:text-[12px] text-red-400">Sin fecha</span>
                      )}

                      {match.scheduled_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="font-body text-[11px] sm:text-[12px]">
                            {match.scheduled_time.slice(0, 5)}
                          </span>
                        </div>
                      )}

                      {match.court && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="font-body text-[11px] sm:text-[12px]">{match.court.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {getStatusBadge(match.status)}
                    <button
                      onClick={() => setEditingMatch(match)}
                      className="p-1.5 sm:p-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Editar horario/cancha"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="p-1.5 sm:p-2 rounded bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                      title="Cargar resultado"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingMatch(match)}
                      className="p-1.5 sm:p-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Score Display (if completed) */}
                {match.status === 'completed' && match.score && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4 font-body text-[14px]">
                      <span className="text-gray-400">Resultado:</span>
                      {match.score.sets.map((set, idx) => (
                        <span key={idx} className="text-white">
                          {set.team1}-{set.team2}
                        </span>
                      ))}
                      {match.score.supertiebreak && (
                        <span className="text-[#dbf228]">
                          ST: {match.score.supertiebreak.team1}-{match.score.supertiebreak.team2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Edit Match Modal */}
      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSuccess={() => {
            setEditingMatch(null);
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Match Result Modal */}
      {selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={() => {
            setSelectedMatch(null);
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Delete Match Modal */}
      {deletingMatch && (
        <DeleteMatchModal
          match={deletingMatch}
          tournamentId={tournamentId}
          onClose={() => setDeletingMatch(null)}
          onSuccess={() => {
            setDeletingMatch(null);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}
