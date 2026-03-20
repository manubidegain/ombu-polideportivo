'use client';

import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { MatchCard } from './MatchCard';

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
  matches: Match[];
  canSubmitScore: (match: Match) => boolean;
  canApproveScore?: (match: Match) => boolean;
  onSubmitScore: (match: Match) => void;
  onApproveScore?: (match: Match) => void;
};

export function CalendarView({
  matches,
  canSubmitScore,
  canApproveScore,
  onSubmitScore,
  onApproveScore
}: Props) {
  // Find the range of dates with matches
  const datesWithMatches = matches
    .filter((m) => m.scheduled_date)
    .map((m) => parseISO(m.scheduled_date!));

  const minDate = datesWithMatches.length > 0
    ? new Date(Math.min(...datesWithMatches.map((d) => d.getTime())))
    : new Date();

  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(minDate)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    if (!match.scheduled_date) return acc;
    const dateKey = format(parseISO(match.scheduled_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Get matches for selected date
  const selectedMatches = selectedDate
    ? matchesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const getMatchesForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return matchesByDate[dateKey] || [];
  };

  const getDayClasses = (day: Date) => {
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
    const matchesForDay = getMatchesForDay(day);
    const hasMatches = matchesForDay.length > 0;
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isToday = isSameDay(day, new Date());

    let classes = 'relative p-2 sm:p-3 rounded-lg transition-all cursor-pointer ';

    if (!isCurrentMonth) {
      classes += 'text-gray-600 ';
    } else if (isSelected) {
      classes += 'bg-[#dbf228] text-[#1b1b1b] font-bold ';
    } else if (isToday) {
      classes += 'bg-[#dbf228]/20 border border-[#dbf228]/50 text-white ';
    } else if (hasMatches) {
      classes += 'bg-white/10 hover:bg-white/15 text-white ';
    } else {
      classes += 'text-gray-400 hover:bg-white/5 ';
    }

    return classes;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Compact Calendar - Left Side */}
      <div className="lg:col-span-4 xl:col-span-3">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 sticky top-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-[18px] text-white capitalize">
              {format(currentMonth, 'MMM yyyy', { locale: es })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
              <div
                key={idx}
                className="text-center font-body text-[10px] text-gray-400 py-1"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, idx) => {
              const matchesForDay = getMatchesForDay(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const hasMatches = matchesForDay.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (matchesForDay.length > 0) {
                      setSelectedDate(day);
                    }
                  }}
                  disabled={!hasMatches}
                  className={`
                    relative aspect-square flex items-center justify-center rounded text-[12px] font-body transition-all
                    ${!isCurrentMonth ? 'text-gray-600' : ''}
                    ${isSelected ? 'bg-[#dbf228] text-[#1b1b1b] font-bold' : ''}
                    ${!isSelected && isToday ? 'bg-[#dbf228]/20 border border-[#dbf228]/50 text-white' : ''}
                    ${!isSelected && !isToday && hasMatches ? 'bg-white/10 hover:bg-white/15 text-white cursor-pointer' : ''}
                    ${!hasMatches ? 'text-gray-500 cursor-default' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {hasMatches && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                      <div className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-[#1b1b1b]' : 'bg-[#dbf228]'
                      }`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Compact Legend */}
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-[#dbf228]/20 border border-[#dbf228]/50" />
              <span className="font-body text-gray-400">Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-white/10" />
              <span className="font-body text-gray-400">Con partidos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-[#dbf228]" />
              <span className="font-body text-gray-400">Seleccionado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matches List - Right Side (Larger) */}
      <div className="lg:col-span-8 xl:col-span-9">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 min-h-[500px]">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#dbf228]" />
                  <div>
                    <h3 className="font-heading text-[20px] text-white capitalize">
                      {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                    </h3>
                    <p className="font-body text-[13px] text-gray-400 mt-0.5">
                      {selectedMatches.length} partido{selectedMatches.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {selectedMatches.length === 0 ? (
                <div className="text-center py-16">
                  <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="font-body text-[14px] text-gray-400">
                    No hay partidos programados para esta fecha
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedMatches
                    .sort((a, b) => {
                      if (!a.scheduled_time || !b.scheduled_time) return 0;
                      return a.scheduled_time.localeCompare(b.scheduled_time);
                    })
                    .map((match, idx) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        canSubmitScore={canSubmitScore(match)}
                        canApproveScore={canApproveScore ? canApproveScore(match) : false}
                        onSubmitScore={() => onSubmitScore(match)}
                        onApproveScore={onApproveScore ? () => onApproveScore(match) : undefined}
                        animationDelay={idx * 30}
                        compact={true}
                      />
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24">
              <CalendarIcon className="w-20 h-20 text-gray-600 mx-auto mb-4 animate-pulse" />
              <p className="font-heading text-[18px] text-white mb-2">
                Seleccioná una fecha
              </p>
              <p className="font-body text-[14px] text-gray-400">
                Elegí un día del calendario para ver los partidos programados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
