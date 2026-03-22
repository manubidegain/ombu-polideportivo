'use client';

import { useState } from 'react';
import { MatchesTab } from './MatchesTab';
import { StandingsTab } from './StandingsTab';

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
  tournament_categories?: {
    name: string;
  };
};

type Props = {
  matches: Match[];
  tournamentId: string;
  availableSeries: Series[];
  hasGroupSeries: boolean;
};

export function FixtureTabs({ matches, tournamentId, availableSeries, hasGroupSeries }: Props) {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'groups' | 'playoffs'>('all');

  // Determine if there are playoff matches
  const hasPlayoffs = availableSeries.some(s => s.phase === 'playoffs' || s.phase === 'finals');
  const hasGroups = hasGroupSeries;

  // Filter matches by phase
  const filteredMatches = matches.filter(match => {
    if (phaseFilter === 'all') return true;
    if (phaseFilter === 'groups') return match.series?.phase === 'groups';
    if (phaseFilter === 'playoffs') return match.series?.phase === 'playoffs' || match.series?.phase === 'finals';
    return true;
  });

  return (
    <div>
      {/* Tabs Header */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('matches')}
          className={`font-heading text-[16px] sm:text-[20px] px-4 sm:px-6 py-3 transition-colors ${
            activeTab === 'matches'
              ? 'text-white border-b-2 border-[#dbf228]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          PARTIDOS ({matches.length})
        </button>
        {hasGroupSeries && (
          <button
            onClick={() => setActiveTab('standings')}
            className={`font-heading text-[16px] sm:text-[20px] px-4 sm:px-6 py-3 transition-colors ${
              activeTab === 'standings'
                ? 'text-white border-b-2 border-[#dbf228]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            POSICIONES
          </button>
        )}
      </div>

      {/* Phase Filter - Only show if both groups and playoffs exist */}
      {activeTab === 'matches' && hasGroups && hasPlayoffs && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPhaseFilter('all')}
            className={`font-body text-[12px] sm:text-[14px] px-4 py-2 rounded transition-colors ${
              phaseFilter === 'all'
                ? 'bg-[#dbf228] text-[#1b1b1b]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            TODOS ({matches.length})
          </button>
          <button
            onClick={() => setPhaseFilter('groups')}
            className={`font-body text-[12px] sm:text-[14px] px-4 py-2 rounded transition-colors ${
              phaseFilter === 'groups'
                ? 'bg-[#dbf228] text-[#1b1b1b]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            GRUPOS ({matches.filter(m => m.series?.phase === 'groups').length})
          </button>
          <button
            onClick={() => setPhaseFilter('playoffs')}
            className={`font-body text-[12px] sm:text-[14px] px-4 py-2 rounded transition-colors ${
              phaseFilter === 'playoffs'
                ? 'bg-[#dbf228] text-[#1b1b1b]'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            PLAYOFFS ({matches.filter(m => m.series?.phase === 'playoffs' || m.series?.phase === 'finals').length})
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'matches' ? (
        <MatchesTab
          matches={filteredMatches}
          tournamentId={tournamentId}
          availableSeries={availableSeries}
        />
      ) : (
        <StandingsTab tournamentId={tournamentId} />
      )}
    </div>
  );
}
