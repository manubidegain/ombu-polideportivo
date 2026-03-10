import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';

type MatchCardProps = {
  match: {
    id: string;
    scheduled_date: string | null;
    scheduled_time: string | null;
    status: string;
    score: any;
    winner_id: string | null;
    tournament: {
      id: string;
      name: string;
      sport_type: string;
    };
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
    court: {
      name: string;
    } | null;
    series: {
      name: string;
      phase: string;
    } | null;
  };
  userTeamId: string;
};

export default function MatchCard({ match, userTeamId }: MatchCardProps) {
  const isUserTeam1 = match.team1.id === userTeamId;
  const opponentTeam = isUserTeam1 ? match.team2 : match.team1;
  const userTeam = isUserTeam1 ? match.team1 : match.team2;

  const isCompleted = match.status === 'completed';
  const isScheduled = match.status === 'scheduled';
  const isToday = match.scheduled_date === new Date().toISOString().split('T')[0];

  const didUserWin = match.winner_id === userTeamId;

  const getStatusBadge = () => {
    const badges = {
      scheduled: 'bg-blue-500/20 text-blue-600',
      in_progress: 'bg-yellow-500/20 text-yellow-600',
      completed: 'bg-green-500/20 text-green-600',
      cancelled: 'bg-red-500/20 text-red-600',
      walkover: 'bg-gray-500/20 text-gray-600',
    };
    const labels = {
      scheduled: 'Programado',
      in_progress: 'En Juego',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
      walkover: 'W.O.',
    };
    const statusKey = match.status as keyof typeof badges;
    return (
      <span className={`px-2 py-1 rounded font-body text-[12px] ${badges[statusKey] || badges.scheduled}`}>
        {labels[statusKey] || match.status}
      </span>
    );
  };

  const formatScore = () => {
    if (!match.score || !match.score.sets) return null;

    return match.score.sets.map((set: any, idx: number) => (
      <span key={idx} className="font-body text-[14px]">
        {isUserTeam1 ? `${set.team1}-${set.team2}` : `${set.team2}-${set.team1}`}
      </span>
    ));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-[#dbf228] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-body text-[12px] text-gray-500">
              {match.tournament.name}
            </p>
            {match.series && (
              <span className="px-2 py-0.5 bg-gray-100 rounded font-body text-[10px] text-gray-600">
                {match.series.phase === 'groups' ? 'Fase de Grupos' : match.series.phase}
                {match.series.name && ` - ${match.series.name}`}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* User's Team */}
            <div className="flex items-center gap-2">
              <p className="font-heading text-[16px] text-[#1b1b1b]">
                {userTeam.team_name}
              </p>
              {isCompleted && didUserWin && (
                <Trophy className="w-4 h-4 text-[#dbf228]" />
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <span className="font-body text-[14px]">vs</span>
            </div>

            {/* Opponent Team */}
            <div className="flex items-center gap-2">
              <p className="font-heading text-[16px] text-gray-700">
                {opponentTeam.team_name}
              </p>
              {isCompleted && !didUserWin && (
                <Trophy className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          {getStatusBadge()}
          {isCompleted && match.score && (
            <div className="flex gap-2 mt-2 justify-end">
              {formatScore()}
            </div>
          )}
        </div>
      </div>

      {/* Match Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-600 border-t border-gray-100 pt-3">
        {match.scheduled_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="font-body text-[12px]">
              {format(new Date(match.scheduled_date), "d MMM yyyy", { locale: es })}
            </span>
          </div>
        )}

        {match.scheduled_time && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="font-body text-[12px]">
              {match.scheduled_time.slice(0, 5)}
            </span>
          </div>
        )}

        {match.court && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="font-body text-[12px]">
              {match.court.name}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isScheduled && isToday && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/mis-torneos/partido/${match.id}`}
            className="block text-center bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
          >
            CARGAR RESULTADO
          </Link>
        </div>
      )}
    </div>
  );
}
