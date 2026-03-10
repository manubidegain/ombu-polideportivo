'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

interface InvitationAcceptFormProps {
  invitationId: string;
  inviteeEmail: string;
}

export function InvitationAcceptForm({ invitationId, inviteeEmail }: InvitationAcceptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setCheckingAuth(false);

      // Verify email matches
      if (user && user.email !== inviteeEmail) {
        toast.error(
          `Esta invitación es para ${inviteeEmail}. Estás logueado como ${user.email}. Por favor, cierra sesión e inicia con la cuenta correcta.`
        );
      }
    };
    checkAuth();
  }, [inviteeEmail]);

  const handleAccept = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para aceptar la invitación');
      return;
    }

    if (user.email !== inviteeEmail) {
      toast.error('Debes iniciar sesión con la cuenta correcta');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update invitation status
      const { error } = await supabase
        .from('tournament_invitations')
        .update({
          status: 'accepted',
          invitee_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('¡Invitación aceptada! Tu equipo está inscrito en el torneo.');

      // Redirect to tournaments page
      setTimeout(() => {
        router.push('/torneos');
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Error al aceptar la invitación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para rechazar la invitación');
      return;
    }

    if (user.email !== inviteeEmail) {
      toast.error('Debes iniciar sesión con la cuenta correcta');
      return;
    }

    const confirmed = confirm('¿Estás seguro que quieres rechazar esta invitación?');
    if (!confirmed) return;

    setLoading(true);

    try {
      const supabase = createClient();

      // Update invitation status
      const { error } = await supabase
        .from('tournament_invitations')
        .update({
          status: 'rejected',
          invitee_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitación rechazada');

      // Redirect to tournaments page
      setTimeout(() => {
        router.push('/torneos');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Error al rechazar la invitación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="text-center py-8">
        <p className="font-body text-[14px] text-gray-600">Verificando autenticación...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="text-center space-y-4">
        <p className="font-body text-[14px] text-gray-700">
          Debes iniciar sesión para responder a esta invitación
        </p>
        <div className="space-y-3">
          <Link
            href={`/auth/login?redirect=/torneos/invitacion/${invitationId}`}
            className="block w-full bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#2b2b2b] transition-colors text-center"
          >
            INICIAR SESIÓN
          </Link>
          <p className="font-body text-[12px] text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              href={`/auth/register?redirect=/torneos/invitacion/${invitationId}`}
              className="text-[#1b1b1b] underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Wrong email
  if (user.email !== inviteeEmail) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="font-body text-[14px] text-yellow-800 mb-4">
          Esta invitación es para <strong>{inviteeEmail}</strong>.<br />
          Estás logueado como <strong>{user.email}</strong>.
        </p>
        <Link
          href="/auth/logout"
          className="inline-block bg-[#1b1b1b] text-white font-body text-[14px] py-2 px-6 rounded hover:bg-[#2b2b2b] transition-colors"
        >
          CERRAR SESIÓN
        </Link>
      </div>
    );
  }

  // Ready to accept/reject
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-body text-[14px] text-blue-800">
          Al aceptar esta invitación, confirmas tu participación en el torneo. Un administrador
          revisará y confirmará la inscripción.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleReject}
          disabled={loading}
          className="w-full bg-white border-2 border-red-500 text-red-500 font-heading text-[16px] py-3 px-6 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <ButtonBallSpinner />}
          {loading ? 'PROCESANDO...' : 'RECHAZAR'}
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#2b2b2b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <ButtonBallSpinner />}
          {loading ? 'PROCESANDO...' : 'ACEPTAR'}
        </button>
      </div>
    </div>
  );
}
