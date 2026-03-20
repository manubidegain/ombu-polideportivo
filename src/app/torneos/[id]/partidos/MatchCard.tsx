'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  AlertCircle,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { useState } from 'react';

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
  };
  team2: {
    id: string;
    team_name: string;
    player_names: string[];
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
  match: Match;
  canSubmitScore: boolean;
  canApproveScore?: boolean;
  onSubmitScore: () => void;
  onApproveScore?: () => void;
  animationDelay?: number;
  compact?: boolean;
};

export function MatchCard({
  match,
  canSubmitScore,
  canApproveScore = false,
  onSubmitScore,
  onApproveScore,
  animationDelay = 0,
  compact = false,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    const badges = {
      scheduled: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        label: compact ? 'Prog.' : 'Programado',
        icon: Clock,
      },
      in_progress: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        label: compact ? 'Jugando' : 'En Juego',
        icon: AlertCircle,
      },
      completed: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
        label: compact ? 'Final.' : 'Finalizado',
        icon: CheckCircle,
      },
    };

    const config = badges[match.status as keyof typeof badges] || badges.scheduled;
    const Icon = config.icon;

    const sizeClasses = compact
      ? 'gap-1 px-2 py-0.5 text-[10px]'
      : 'gap-1.5 px-3 py-1 text-[12px]';
    const iconSize = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';

    return (
      <span
        className={`inline-flex items-center rounded-full ${config.bg} ${config.border} border ${config.text} font-body ${sizeClasses}`}
      >
        <Icon className={iconSize} />
        {config.label}
      </span>
    );
  };

  const getScoreStatusBadge = () => {
    if (match.score_status === 'pending_approval') {
      const sizeClasses = compact
        ? 'gap-1 px-2 py-0.5 text-[10px]'
        : 'gap-1.5 px-3 py-1 text-[11px]';
      const iconSize = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';

      return (
        <span className={`inline-flex items-center rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400 font-body ${sizeClasses}`}>
          <Clock className={iconSize} />
          {compact ? 'Pend.' : 'Pendiente'}
        </span>
      );
    }
    return null;
  };

  const winner = match.score
    ? match.score.sets.reduce(
        (acc, set) => {
          if (set.team1 > set.team2) acc.team1++;
          else if (set.team2 > set.team1) acc.team2++;
          return acc;
        },
        { team1: 0, team2: 0 }
      )
    : null;

  // Ultra-compact version for list view with many matches
  if (compact) {
    return (
      <div
        className="group bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-[#dbf228]/50 hover:bg-white/10 transition-all duration-200 animate-slideIn"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="p-2.5">
          <div className="flex items-center gap-2 mb-2">
            {/* Category/Series badges */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-body bg-[#dbf228]/10 text-[#dbf228] border border-[#dbf228]/20">
              {match.series.category}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-body bg-white/10 text-gray-300 border border-white/20">
              {match.series.name}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {getStatusBadge()}
              {getScoreStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
            {/* Teams Column */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-body text-[13px] text-white font-medium truncate">
                  {match.team1.team_name}
                </span>
                {match.score && winner && (winner.team1 || 0) > (winner.team2 || 0) && (
                  <Trophy className="w-3 h-3 text-[#dbf228] shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-body text-[13px] text-white font-medium truncate">
                  {match.team2.team_name}
                </span>
                {match.score && winner && (winner.team2 || 0) > (winner.team1 || 0) && (
                  <Trophy className="w-3 h-3 text-[#dbf228] shrink-0" />
                )}
              </div>
            </div>

            {/* Score Column */}
            {match.score && winner ? (
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <span className="font-heading text-[16px] text-white leading-none">
                  {winner.team1}
                </span>
                <span className="font-heading text-[16px] text-white leading-none">
                  {winner.team2}
                </span>
              </div>
            ) : (
              <div className="min-w-[40px]" />
            )}

            {/* Details Column */}
            <div className="flex flex-col gap-1 text-gray-400 shrink-0 text-right">
              {match.scheduled_time && (
                <div className="flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  <span className="font-body text-[11px]">
                    {match.scheduled_time.slice(0, 5)}
                  </span>
                </div>
              )}
              {match.court && (
                <div className="flex items-center gap-1 justify-end">
                  <MapPin className="w-3 h-3" />
                  <span className="font-body text-[11px]">{match.court}</span>
                </div>
              )}
            </div>
          </div>

          {/* Score Details (if completed) - More compact */}
          {match.status === 'completed' && match.score && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px]">
              <span className="text-gray-400">Sets:</span>
              {match.score.sets.map((set, idx) => (
                <span key={idx} className="text-white font-medium">
                  {set.team1}-{set.team2}
                </span>
              ))}
              {match.score.supertiebreak && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-[#dbf228] font-medium">
                    ST {match.score.supertiebreak.team1}-{match.score.supertiebreak.team2}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons - Inline */}
          {(canSubmitScore || canApproveScore) && match.status !== 'completed' && (
            <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
              {canSubmitScore && match.score_status !== 'pending_approval' && (
                <button
                  onClick={onSubmitScore}
                  className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[11px] py-1.5 px-3 rounded hover:bg-[#c5db23] transition-all"
                >
                  CARGAR RESULTADO
                </button>
              )}
              {canApproveScore && match.score_status === 'pending_approval' && onApproveScore && (
                <button
                  onClick={onApproveScore}
                  className="flex-1 bg-green-500 text-white font-heading text-[11px] py-1.5 px-3 rounded hover:bg-green-600 transition-all"
                >
                  APROBAR/RECHAZAR
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version for calendar/detailed view
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-[#dbf228]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#dbf228]/10 animate-fadeIn"
      style={{ animationDelay: `${animationDelay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 sm:p-5">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-4">
          {getStatusBadge()}
          {getScoreStatusBadge()}
        </div>

        {/* Teams */}
        <div className="space-y-3 mb-4">
          {/* Team 1 */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              (winner?.team1 || 0) > (winner?.team2 || 0)
                ? 'bg-[#dbf228]/10 border border-[#dbf228]/30'
                : 'bg-white/5'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-body text-[16px] text-white font-semibold">
                  {match.team1.team_name}
                </span>
                {(winner?.team1 || 0) > (winner?.team2 || 0) && (
                  <Trophy className="w-4 h-4 text-[#dbf228]" />
                )}
              </div>
              {match.team1.player_names.length > 0 && (
                <p className="font-body text-[12px] text-gray-400 mt-1">
                  {match.team1.player_names.join(' / ')}
                </p>
              )}
            </div>
            {match.score && winner && (
              <div className="font-heading text-[24px] text-white ml-4">
                {winner.team1}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="h-px bg-white/10 flex-1" />
            <span className="font-body text-[12px] text-gray-400 px-3">vs</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Team 2 */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              (winner?.team2 || 0) > (winner?.team1 || 0)
                ? 'bg-[#dbf228]/10 border border-[#dbf228]/30'
                : 'bg-white/5'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-body text-[16px] text-white font-semibold">
                  {match.team2.team_name}
                </span>
                {(winner?.team2 || 0) > (winner?.team1 || 0) && (
                  <Trophy className="w-4 h-4 text-[#dbf228]" />
                )}
              </div>
              {match.team2.player_names.length > 0 && (
                <p className="font-body text-[12px] text-gray-400 mt-1">
                  {match.team2.player_names.join(' / ')}
                </p>
              )}
            </div>
            {match.score && winner && (
              <div className="font-heading text-[24px] text-white ml-4">
                {winner.team2}
              </div>
            )}
          </div>
        </div>

        {/* Score Details */}
        {match.status === 'completed' && match.score && (
          <div className="bg-black/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-body text-[12px] text-gray-400">Sets:</span>
              {match.score.sets.map((set, idx) => (
                <span
                  key={idx}
                  className="font-body text-[14px] text-white font-semibold"
                >
                  {set.team1}-{set.team2}
                </span>
              ))}
              {match.score.supertiebreak && (
                <>
                  <span className="font-body text-[12px] text-gray-400">•</span>
                  <span className="font-body text-[14px] text-[#dbf228] font-semibold">
                    ST: {match.score.supertiebreak.team1}-
                    {match.score.supertiebreak.team2}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Match Details */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-400">
          {match.scheduled_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="font-body text-[13px]">
                {format(parseISO(match.scheduled_date), 'EEEE d MMM', {
                  locale: es,
                })}
              </span>
            </div>
          )}

          {match.scheduled_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-body text-[13px]">
                {match.scheduled_time.slice(0, 5)}
              </span>
            </div>
          )}

          {match.court && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="font-body text-[13px]">{match.court}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(canSubmitScore || canApproveScore) &&
          match.status !== 'completed' && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {/* Submit Score Button */}
              {canSubmitScore && match.score_status !== 'pending_approval' && (
                <button
                  onClick={onSubmitScore}
                  className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-2.5 px-4 rounded hover:bg-[#c5db23] transition-all flex items-center justify-center gap-2 group"
                >
                  <Upload className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                  CARGAR RESULTADO
                </button>
              )}

              {/* Approve Score Button */}
              {canApproveScore &&
                match.score_status === 'pending_approval' &&
                onApproveScore && (
                  <button
                    onClick={onApproveScore}
                    className="w-full bg-green-500 text-white font-heading text-[14px] py-2.5 px-4 rounded hover:bg-green-600 transition-all flex items-center justify-center gap-2 animate-pulse"
                  >
                    <CheckCircle className="w-4 h-4" />
                    APROBAR / RECHAZAR RESULTADO
                  </button>
                )}
            </div>
          )}
      </div>
    </div>
  );
}
