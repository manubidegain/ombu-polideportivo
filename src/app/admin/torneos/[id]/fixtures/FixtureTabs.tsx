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
};

type Props = {
  matches: Match[];
  tournamentId: string;
  availableSeries: Series[];
  hasGroupSeries: boolean;
};

export function FixtureTabs({ matches, tournamentId, availableSeries, hasGroupSeries }: Props) {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');

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

      {/* Tab Content */}
      {activeTab === 'matches' ? (
        <MatchesTab
          matches={matches}
          tournamentId={tournamentId}
          availableSeries={availableSeries}
        />
      ) : (
        <StandingsTab tournamentId={tournamentId} />
      )}
    </div>
  );
}
