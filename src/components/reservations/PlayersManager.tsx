'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import { toast } from 'sonner';

type ReservationPlayer = Tables<'reservation_players'> & {
  user_profiles: { full_name: string | null; email: string | null } | null;
};

interface PlayersManagerProps {
  reservationId: string;
  reservationOwnerId: string | null;
  currentUserId: string | null;
  initialPlayers: ReservationPlayer[];
}

export function PlayersManager({
  reservationId,
  reservationOwnerId,
  currentUserId,
  initialPlayers,
}: PlayersManagerProps) {
  const [players, setPlayers] = useState<ReservationPlayer[]>(initialPlayers);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const isOwner = currentUserId === reservationOwnerId;
  const isInvitedAndConfirmed = players.some(
    (p) => p.user_id === currentUserId && p.status === 'confirmed'
  );

  const confirmedPlayers = players.filter((p) => p.status === 'confirmed');
  const pendingPlayers = players.filter((p) => p.status === 'pending');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    const supabase = createClient();

    try {
      // Check if user exists with this email
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('email', inviteEmail.toLowerCase())
        .single();

      // Create invitation
      const { error: inviteError } = await supabase.from('reservation_players').insert({
        reservation_id: reservationId,
        user_id: userProfile?.id || null,
        invitation_email: inviteEmail.toLowerCase(),
        invited_by: currentUserId!,
        status: 'pending',
      });

      if (inviteError) {
        if (inviteError.code === '23505') {
          toast.error('Este email ya fue invitado a esta reserva');
        } else {
          throw inviteError;
        }
        return;
      }

      // Send invitation email
      try {
        const emailResponse = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationEmail: inviteEmail.toLowerCase(),
            reservationId,
            userExists: !!userProfile,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send invitation email');
          // Don't throw - invitation was created, just email failed
          toast.warning(
            'Invitación creada pero el email no pudo ser enviado. Contactá al jugador directamente.'
          );
        } else {
          toast.success(
            userProfile
              ? `Invitación enviada a ${userProfile.full_name || inviteEmail}`
              : `Invitación enviada a ${inviteEmail}. Deberán registrarse para aceptar.`
          );
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        toast.warning(
          'Invitación creada pero el email no pudo ser enviado. Contactá al jugador directamente.'
        );
      }

      setInviteEmail('');
      setShowInviteForm(false);
      router.refresh();
    } catch (error) {
      console.error('Error inviting player:', error);
      toast.error('Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setActionLoading(playerId);

    const promise = (async () => {
      const supabase = createClient();
      const { error } = await supabase.from('reservation_players').delete().eq('id', playerId);

      if (error) {
        console.error('Error removing player:', error);
        throw error;
      }

      // Update local state immediately
      setPlayers(players.filter(p => p.id !== playerId));
    })();

    toast.promise(
      promise,
      {
        loading: 'Eliminando invitación...',
        success: 'Invitación eliminada correctamente',
        error: 'Error al eliminar invitación',
      }
    );

    await promise;
    setActionLoading(null);
    router.refresh();
  };

  const handleRespondToInvitation = async (playerId: string, status: 'confirmed' | 'declined') => {
    setActionLoading(`${playerId}-${status}`);

    const promise = (async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('reservation_players')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', playerId);

      if (error) {
        console.error('Error responding to invitation:', error);
        throw error;
      }

      // Update local state immediately
      setPlayers(players.map(p =>
        p.id === playerId
          ? { ...p, status, responded_at: new Date().toISOString() }
          : p
      ));
    })();

    toast.promise(
      promise,
      {
        loading: 'Procesando respuesta...',
        success: status === 'confirmed' ? 'Invitación aceptada' : 'Invitación rechazada',
        error: 'Error al responder invitación',
      }
    );

    await promise;
    setActionLoading(null);
    router.refresh();
  };

  const getPlayerDisplay = (player: ReservationPlayer) => {
    if (player.user_id && player.user_profiles) {
      return player.user_profiles.full_name || player.user_profiles.email || player.invitation_email;
    }
    return player.invitation_email;
  };

  const getPlayerStatus = (player: ReservationPlayer) => {
    if (!player.user_id) {
      return 'Pendiente registro';
    }
    return player.status === 'confirmed' ? 'Confirmado' : 'Pendiente';
  };

  if (!isOwner && !isInvitedAndConfirmed) {
    return null; // Don't show this section to non-owners/non-confirmed users
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[24px] text-white">JUGADORES</h2>
        {isOwner && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
          >
            + Invitar Jugador
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && isOwner && (
        <form onSubmit={handleInvite} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Email del jugador
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="jugador@ejemplo.com"
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
            <p className="font-body text-[12px] text-gray-400 mt-1">
              Si el email tiene cuenta, recibirá una notificación. Si no, recibirá un link para registrarse.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInviteForm(false);
                setInviteEmail('');
              }}
              className="px-4 py-2 font-body text-[14px] text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Players List */}
      {players.length === 0 ? (
        <p className="text-center font-body text-[14px] text-gray-400 py-8">
          No hay jugadores invitados. {isOwner && 'Invita jugadores para comenzar.'}
        </p>
      ) : (
        <div className="space-y-4">
          {/* Confirmed Players */}
          {confirmedPlayers.length > 0 && (
            <div>
              <h3 className="font-body text-[12px] text-gray-400 mb-2">
                Confirmados ({confirmedPlayers.length})
              </h3>
              <div className="space-y-2">
                {confirmedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-green-500/10 border border-green-500/30 rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-body text-[14px] text-white">{getPlayerDisplay(player)}</p>
                      <p className="font-body text-[12px] text-green-400">
                        {getPlayerStatus(player)}
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={actionLoading === player.id}
                        className="text-red-400 hover:text-red-300 font-body text-[12px] disabled:opacity-50"
                      >
                        {actionLoading === player.id ? '...' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Players */}
          {pendingPlayers.length > 0 && (
            <div>
              <h3 className="font-body text-[12px] text-gray-400 mb-2">
                Pendientes ({pendingPlayers.length})
              </h3>
              <div className="space-y-2">
                {pendingPlayers.map((player) => {
                  const isCurrentUser = player.user_id === currentUserId;
                  return (
                    <div
                      key={player.id}
                      className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-body text-[14px] text-white">{getPlayerDisplay(player)}</p>
                        <p className="font-body text-[12px] text-yellow-400">
                          {getPlayerStatus(player)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {isCurrentUser && player.user_id && (
                          <>
                            <button
                              onClick={() => handleRespondToInvitation(player.id, 'confirmed')}
                              disabled={actionLoading === `${player.id}-confirmed`}
                              className="bg-green-500/20 text-green-400 px-3 py-1 rounded font-body text-[12px] hover:bg-green-500/30 disabled:opacity-50"
                            >
                              {actionLoading === `${player.id}-confirmed` ? '...' : 'Aceptar'}
                            </button>
                            <button
                              onClick={() => handleRespondToInvitation(player.id, 'declined')}
                              disabled={actionLoading === `${player.id}-declined`}
                              className="bg-red-500/20 text-red-400 px-3 py-1 rounded font-body text-[12px] hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {actionLoading === `${player.id}-declined` ? '...' : 'Rechazar'}
                            </button>
                          </>
                        )}
                        {isOwner && !isCurrentUser && (
                          <>
                            <button
                              onClick={() => handleRespondToInvitation(player.id, 'confirmed')}
                              disabled={actionLoading === `${player.id}-confirmed`}
                              className="bg-green-500/20 text-green-400 px-3 py-1 rounded font-body text-[12px] hover:bg-green-500/30 disabled:opacity-50"
                            >
                              {actionLoading === `${player.id}-confirmed` ? '...' : 'Aprobar'}
                            </button>
                            <button
                              onClick={() => handleRemovePlayer(player.id)}
                              disabled={actionLoading === player.id}
                              className="bg-red-500/20 text-red-400 px-3 py-1 rounded font-body text-[12px] hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {actionLoading === player.id ? '...' : 'Rechazar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
