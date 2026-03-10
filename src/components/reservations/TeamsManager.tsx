'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import { toast } from 'sonner';

type ReservationPlayer = Tables<'reservation_players'> & {
  user_profiles: { full_name: string | null } | null;
};

interface TeamsManagerProps {
  reservationId: string;
  reservationOwnerId: string | null;
  currentUserId: string | null;
  confirmedPlayers: ReservationPlayer[];
  teamConfig: Tables<'reservation_teams'> | null;
}

export function TeamsManager({
  reservationId,
  reservationOwnerId,
  currentUserId,
  confirmedPlayers,
  teamConfig: initialTeamConfig,
}: TeamsManagerProps) {
  const [teamConfig, setTeamConfig] = useState(initialTeamConfig);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number>(5);
  const router = useRouter();

  const isOwner = currentUserId === reservationOwnerId;
  const isInvitedPlayer = confirmedPlayers.some((p) => p.user_id === currentUserId);

  const teamAPlayers = confirmedPlayers.filter((p) => p.team_assignment === 'team_a');
  const teamBPlayers = confirmedPlayers.filter((p) => p.team_assignment === 'team_b');
  const unassignedPlayers = confirmedPlayers.filter((p) => p.team_assignment === 'unassigned' || !p.team_assignment);

  const handleRandomTeams = async () => {
    if (confirmedPlayers.length < 2) {
      toast.error('Necesitas al menos 2 jugadores confirmados para formar equipos');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    toast.promise(
      (async () => {
        // Shuffle players
        const shuffled = [...confirmedPlayers].sort(() => Math.random() - 0.5);

        // Split into teams
        const teamA = shuffled.slice(0, teamSize);
        const teamB = shuffled.slice(teamSize, teamSize * 2);

        // Update assignments
        const updates = [
          ...teamA.map((p) => ({
            id: p.id,
            team_assignment: 'team_a' as const,
          })),
          ...teamB.map((p) => ({
            id: p.id,
            team_assignment: 'team_b' as const,
          })),
          ...shuffled.slice(teamSize * 2).map((p) => ({
            id: p.id,
            team_assignment: 'unassigned' as const,
          })),
        ];

        for (const update of updates) {
          await supabase
            .from('reservation_players')
            .update({ team_assignment: update.team_assignment })
            .eq('id', update.id);
        }

        // Create or update team config
        if (teamConfig) {
          await supabase
            .from('reservation_teams')
            .update({
              team_size: teamSize,
              formation_method: 'random',
            })
            .eq('id', teamConfig.id);
        } else {
          await supabase.from('reservation_teams').insert({
            reservation_id: reservationId,
            team_size: teamSize,
            formation_method: 'random',
          });
        }

        router.refresh();
      })(),
      {
        loading: 'Formando equipos...',
        success: `Equipos formados: ${teamSize} jugadores por lado`,
        error: 'Error al formar equipos',
      }
    );

    setLoading(false);
  };

  const handleMovePlayer = async (playerId: string, toTeam: 'team_a' | 'team_b' | 'unassigned') => {
    setActionLoading(`${playerId}-${toTeam}`);
    const promise = (async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('reservation_players')
        .update({ team_assignment: toTeam })
        .eq('id', playerId);

      if (error) {
        console.error('Error moving player:', error);
        throw error;
      }

      router.refresh();
    })();

    toast.promise(promise, {
      loading: 'Moviendo jugador...',
      success: 'Jugador movido',
      error: 'Error al mover jugador',
    });

    promise.finally(() => setActionLoading(null));
  };

  const handleClearTeams = async () => {
    setActionLoading('clear');
    const promise = (async () => {
      const supabase = createClient();

      // Reset all players to unassigned
      for (const player of confirmedPlayers) {
        await supabase
          .from('reservation_players')
          .update({ team_assignment: 'unassigned' })
          .eq('id', player.id);
      }

      router.refresh();
    })();

    toast.promise(promise, {
      loading: 'Borrando equipos...',
      success: 'Equipos borrados',
      error: 'Error al borrar equipos',
    });

    promise.finally(() => setActionLoading(null));
  };

  // Only show to owner or confirmed players
  if (!isOwner && !isInvitedPlayer) {
    return null;
  }

  if (confirmedPlayers.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="font-heading text-[24px] text-white mb-4">EQUIPOS</h2>
        <p className="text-center font-body text-[14px] text-gray-400 py-8">
          {isOwner ? 'Invita jugadores y espera confirmación para formar equipos' : 'Aún no hay jugadores confirmados'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[24px] text-white">EQUIPOS</h2>
        {isOwner && (
          <div className="flex gap-2">
            {(teamAPlayers.length > 0 || teamBPlayers.length > 0) && (
              <button
                onClick={handleClearTeams}
                disabled={actionLoading === 'clear'}
                className="bg-red-500/20 text-red-400 font-body text-[14px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'clear' ? 'Borrando...' : 'Borrar Equipos'}
              </button>
            )}
            <button
              onClick={() => setShowTeamForm(!showTeamForm)}
              className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
            >
              Formar Equipos
            </button>
          </div>
        )}
      </div>

      {/* Team Formation Options */}
      {showTeamForm && isOwner && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Jugadores por equipo
            </label>
            <input
              type="number"
              min="1"
              max={Math.floor(confirmedPlayers.length / 2)}
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
            <p className="font-body text-[12px] text-gray-400 mt-1">
              {confirmedPlayers.length} jugadores confirmados ({Math.floor(confirmedPlayers.length / 2)} por equipo máximo)
            </p>
          </div>

          <button
            onClick={handleRandomTeams}
            disabled={loading}
            className="w-full bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50"
          >
            {loading ? 'Formando...' : 'Formar Equipos Aleatorios'}
          </button>
        </div>
      )}

      {/* Teams Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-heading text-[18px] text-blue-400 mb-3">
            {teamConfig?.team_a_name || 'EQUIPO A'} ({teamAPlayers.length})
          </h3>
          <div className="space-y-2">
            {teamAPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white/5 rounded p-2 flex items-center justify-between"
              >
                <span className="font-body text-[14px] text-white">
                  {player.user_profiles?.full_name || player.invitation_email || 'Sin nombre'}
                </span>
                {isOwner && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMovePlayer(player.id, 'team_b')}
                      className="text-[12px] text-gray-400 hover:text-white"
                      title="Mover a Equipo B"
                    >
                      →
                    </button>
                    <button
                      onClick={() => handleMovePlayer(player.id, 'unassigned')}
                      className="text-[12px] text-gray-400 hover:text-white"
                      title="Quitar del equipo"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            {teamAPlayers.length === 0 && (
              <p className="text-center font-body text-[12px] text-gray-400 py-4">
                Sin jugadores
              </p>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h3 className="font-heading text-[18px] text-red-400 mb-3">
            {teamConfig?.team_b_name || 'EQUIPO B'} ({teamBPlayers.length})
          </h3>
          <div className="space-y-2">
            {teamBPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white/5 rounded p-2 flex items-center justify-between"
              >
                <span className="font-body text-[14px] text-white">
                  {player.user_profiles?.full_name || player.invitation_email || 'Sin nombre'}
                </span>
                {isOwner && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMovePlayer(player.id, 'team_a')}
                      className="text-[12px] text-gray-400 hover:text-white"
                      title="Mover a Equipo A"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => handleMovePlayer(player.id, 'unassigned')}
                      className="text-[12px] text-gray-400 hover:text-white"
                      title="Quitar del equipo"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            {teamBPlayers.length === 0 && (
              <p className="text-center font-body text-[12px] text-gray-400 py-4">
                Sin jugadores
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="font-body text-[14px] text-gray-400 mb-2">
            Sin asignar ({unassignedPlayers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white/10 rounded px-3 py-2 flex items-center gap-2"
              >
                <span className="font-body text-[14px] text-white">
                  {player.user_profiles?.full_name || player.invitation_email || 'Sin nombre'}
                </span>
                {isOwner && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMovePlayer(player.id, 'team_a')}
                      className="text-[12px] text-blue-400 hover:text-blue-300"
                      title="A Equipo A"
                    >
                      A
                    </button>
                    <button
                      onClick={() => handleMovePlayer(player.id, 'team_b')}
                      className="text-[12px] text-red-400 hover:text-red-300"
                      title="A Equipo B"
                    >
                      B
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
