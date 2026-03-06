'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface JoinReservationFormProps {
  reservationId: string;
  userEmail: string;
  requiresApproval: boolean;
}

export function JoinReservationForm({
  reservationId,
  userEmail,
  requiresApproval,
}: JoinReservationFormProps) {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handleJoin = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Create player invitation
      const { error } = await supabase.from('reservation_players').insert({
        reservation_id: reservationId,
        user_id: user.id,
        invitation_email: userEmail,
        invited_by: user.id, // Self-invited via public link
        status: requiresApproval ? 'pending' : 'confirmed',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya estás en esta reserva');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      if (requiresApproval) {
        toast.success('Solicitud enviada. El organizador debe aprobarla.');
      } else {
        toast.success('¡Te uniste a la reserva exitosamente!');
      }

      router.push('/mis-reservas');
    } catch (error) {
      console.error('Error joining reservation:', error);
      toast.error('Error al unirse a la reserva');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded opacity-50"
        >
          Cargando...
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50"
      >
        {loading
          ? 'Procesando...'
          : !isLoggedIn
          ? 'Iniciar Sesión para Unirse'
          : requiresApproval
          ? 'Solicitar Unirse'
          : 'Unirse Ahora'}
      </button>

      {!isLoggedIn && (
        <p className="text-center font-body text-[12px] text-gray-400">
          Necesitás crear una cuenta o iniciar sesión para unirte a esta reserva
        </p>
      )}

      <a
        href="/"
        className="block text-center font-body text-[14px] text-gray-400 hover:text-white transition-colors"
      >
        Cancelar
      </a>
    </div>
  );
}
