'use client';

type TournamentStatus = 'draft' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';

interface TournamentStatusBadgeProps {
  status: string;
}

export function TournamentStatusBadge({ status }: TournamentStatusBadgeProps) {
  const getStatusLabel = (status: string) => {
    const labels: Record<TournamentStatus, string> = {
      draft: 'Borrador',
      registration_open: 'Inscripciones abiertas',
      in_progress: 'En curso',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
    };
    return labels[status as TournamentStatus] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<TournamentStatus, string> = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      registration_open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status as TournamentStatus] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <span
      className={`px-3 py-1 rounded-full font-body text-[12px] border ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
