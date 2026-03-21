'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { MatchesList } from './MatchesList';
import { CreateMatchButton } from './CreateMatchButton';

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

type Series = {
  id: string;
  name: string;
  phase: string;
  category_id: string;
};

type Props = {
  matches: Match[];
  tournamentId: string;
  availableSeries: Series[];
};

export function MatchesTab({ matches, tournamentId, availableSeries }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleUpdate = () => {
    router.refresh();
  };

  // Filter matches based on search term and status
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.team1.team_name.toLowerCase().includes(term) ||
          match.team2.team_name.toLowerCase().includes(term) ||
          match.series?.name.toLowerCase().includes(term) ||
          match.series?.category.toLowerCase().includes(term) ||
          match.court?.name.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((match) => match.status === statusFilter);
    }

    return filtered;
  }, [matches, searchTerm, statusFilter]);

  // Get unique statuses for filter
  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(matches.map((m) => m.status));
    return Array.from(uniqueStatuses);
  }, [matches]);

  return (
    <div className="space-y-6">
      {/* Create Match Button */}
      {availableSeries.length > 0 && (
        <CreateMatchButton
          tournamentId={tournamentId}
          availableSeries={availableSeries}
        />
      )}

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por pareja, serie, categoría o cancha..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-400 font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228] focus:border-transparent min-w-[160px]"
          >
            <option value="all">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'scheduled'
                  ? 'Programados'
                  : status === 'completed'
                  ? 'Finalizados'
                  : status === 'in_progress'
                  ? 'En curso'
                  : status}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="font-body text-[13px] text-gray-400">
              Mostrando {filteredMatches.length} de {matches.length} partidos
            </p>
          </div>
        )}
      </div>

      {/* Matches List */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
        {filteredMatches.length > 0 ? (
          <MatchesList
            matches={filteredMatches}
            tournamentId={tournamentId}
            onUpdate={handleUpdate}
          />
        ) : searchTerm || statusFilter !== 'all' ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="font-body text-[16px] text-gray-400 mb-2">
              No se encontraron partidos
            </p>
            <p className="font-body text-[14px] text-gray-500">
              Intentá con otros términos de búsqueda o filtros
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="font-body text-[16px] text-gray-400">
              No se han generado partidos todavía. Usa el generador de fixture arriba para crear
              series y partidos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
