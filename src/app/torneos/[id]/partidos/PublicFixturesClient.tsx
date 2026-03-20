'use client';

import { useState } from 'react';
import { Calendar, List, Filter, Clock, MapPin, Trophy, Users, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { MatchCard } from './MatchCard';
import { CalendarView } from './CalendarView';
import { SubmitScoreModal } from './SubmitScoreModal';
import { ApproveScoreModal } from './ApproveScoreModal';
import { PublicStandings } from './PublicStandings';

type Match = {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  score_status: string;
  score_submitted_at: string | null;
  team1: {
    id: string;
    team_name: string;
    player_names: string[];
    player1_id?: string;
    player2_id?: string;
  };
  team2: {
    id: string;
    team_name: string;
    player_names: string[];
    player1_id?: string;
    player2_id?: string;
  };
  court: string | null;
  series: {
    name: string;
    phase: string;
    category: string;
  };
  score?: {
    sets: Array<{ team1: number; team2: number }>;
    supertiebreak?: { team1: number; team2: number };
  };
};

type Props = {
  matches: Match[];
  tournamentId: string;
  userId?: string;
  userRegistrationIds: string[];
};

export function PublicFixturesClient({
  matches,
  tournamentId,
  userId,
  userRegistrationIds,
}: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'standings'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [approvingMatch, setApprovingMatch] = useState<Match | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = Array.from(
    new Set(matches.map((m) => m.series.category))
  ).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

  // Get unique series (filtered by category if selected)
  const availableSeries = Array.from(
    new Set(
      matches
        .filter((m) => selectedCategory === 'all' || m.series.category === selectedCategory)
        .map((m) => m.series.name)
    )
  ).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (selectedCategory !== 'all' && match.series.category !== selectedCategory) {
      return false;
    }
    if (selectedSeries !== 'all' && match.series.name !== selectedSeries) {
      return false;
    }
    if (selectedStatus !== 'all' && match.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Check if user can submit score for a match
  const canSubmitScore = (match: Match) => {
    if (!userId) return false;
    return (
      userRegistrationIds.includes(match.team1.id) ||
      userRegistrationIds.includes(match.team2.id)
    );
  };

  // Check if user can approve score (rival team or admin)
  const canApproveScore = (match: Match) => {
    if (!userId || match.score_status !== 'pending_approval') return false;

    // For now, we'll let any team member approve
    // In production, you'd check if this user is from the rival team
    return (
      userRegistrationIds.includes(match.team1.id) ||
      userRegistrationIds.includes(match.team2.id)
    );
  };

  // Stats
  const stats = {
    total: matches.length,
    completed: matches.filter((m) => m.status === 'completed').length,
    scheduled: matches.filter((m) => m.status === 'scheduled').length,
    inProgress: matches.filter((m) => m.status === 'in_progress').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#dbf228]/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Total</p>
              <p className="font-heading text-[24px] text-white">{stats.total}</p>
            </div>
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:border-green-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[12px] text-green-400 mb-1">Finalizados</p>
              <p className="font-heading text-[24px] text-white">{stats.completed}</p>
            </div>
            <Trophy className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[12px] text-blue-400 mb-1">Programados</p>
              <p className="font-heading text-[24px] text-white">{stats.scheduled}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover:border-yellow-500/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-[12px] text-yellow-400 mb-1">En Juego</p>
              <p className="font-heading text-[24px] text-white">{stats.inProgress}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex flex-col gap-4">
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="font-body text-[12px] text-gray-400">Filtros:</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSeries('all'); // Reset series when category changes
              }}
              className="bg-white/10 border border-white/20 rounded px-3 py-1.5 font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50 transition-all [&>option]:bg-[#1b1b1b] [&>option]:text-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Series Filter */}
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-1.5 font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50 transition-all disabled:opacity-50 [&>option]:bg-[#1b1b1b] [&>option]:text-white"
              disabled={availableSeries.length === 0}
            >
              <option value="all">Todas las series</option>
              {availableSeries.map((series) => (
                <option key={series} value={series}>
                  {series}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-1.5 font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]/50 transition-all [&>option]:bg-[#1b1b1b] [&>option]:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Programados</option>
              <option value="in_progress">En Juego</option>
              <option value="completed">Finalizados</option>
            </select>

            {/* Results count */}
            <div className="ml-auto">
              <span className="font-body text-[13px] text-gray-400">
                {filteredMatches.length} partido{filteredMatches.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* View Toggle Row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">

            <span className="font-body text-[14px] text-gray-400">Vista:</span>
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded font-body text-[13px] sm:text-[14px] transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#dbf228] text-[#1b1b1b]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded font-body text-[13px] sm:text-[14px] transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-[#dbf228] text-[#1b1b1b]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </button>
              <button
                onClick={() => setViewMode('standings')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded font-body text-[13px] sm:text-[14px] transition-all ${
                  viewMode === 'standings'
                    ? 'bg-[#dbf228] text-[#1b1b1b]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Posiciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'standings' ? (
        <PublicStandings
          tournamentId={tournamentId}
          selectedCategory={selectedCategory}
          selectedSeries={selectedSeries}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
              <p className="font-body text-[16px] text-gray-400">
                No se encontraron partidos con los filtros seleccionados
              </p>
            </div>
          ) : (
            // Simple flat list with all matches - categories/series are shown in badges
            <div className="space-y-1.5">
              {filteredMatches.map((match, idx) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  canSubmitScore={canSubmitScore(match)}
                  canApproveScore={canApproveScore(match)}
                  onSubmitScore={() => setSelectedMatch(match)}
                  onApproveScore={() => setApprovingMatch(match)}
                  animationDelay={idx * 20}
                  compact={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <CalendarView
          matches={filteredMatches}
          canSubmitScore={canSubmitScore}
          canApproveScore={canApproveScore}
          onSubmitScore={setSelectedMatch}
          onApproveScore={setApprovingMatch}
        />
      )}

      {/* Submit Score Modal */}
      {selectedMatch && (
        <SubmitScoreModal
          match={selectedMatch}
          tournamentId={tournamentId}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Approve Score Modal */}
      {approvingMatch && (
        <ApproveScoreModal
          match={approvingMatch}
          onClose={() => setApprovingMatch(null)}
        />
      )}
    </div>
  );
}
