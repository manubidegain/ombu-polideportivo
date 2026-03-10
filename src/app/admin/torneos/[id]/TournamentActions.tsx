'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Tables } from '@/types/database.types';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type TournamentStatus = 'draft' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';

interface TournamentActionsProps {
  tournament: Tables<'tournaments'>;
}

export function TournamentActions({ tournament }: TournamentActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: TournamentStatus) => {
    if (!confirm(`¿Cambiar el estado del torneo a "${getStatusLabel(newStatus)}"?`)) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const promise = (async () => {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tournament.id);

      if (error) throw error;
    })();

    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: 'Estado actualizado correctamente',
      error: 'Error al actualizar el estado',
    });

    await promise;
    setLoading(false);
    router.refresh();
  };

  const getStatusLabel = (status: TournamentStatus) => {
    const labels: Record<TournamentStatus, string> = {
      draft: 'Borrador',
      registration_open: 'Inscripciones abiertas',
      in_progress: 'En curso',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
    };
    return labels[status];
  };

  const getAvailableActions = () => {
    const actions: { label: string; status: TournamentStatus; color: string }[] = [];

    switch (tournament.status) {
      case 'draft':
        actions.push({
          label: 'Abrir inscripciones',
          status: 'registration_open',
          color: 'bg-blue-500 hover:bg-blue-600',
        });
        actions.push({
          label: 'Cancelar torneo',
          status: 'cancelled',
          color: 'bg-red-500 hover:bg-red-600',
        });
        break;

      case 'registration_open':
        actions.push({
          label: 'Iniciar torneo',
          status: 'in_progress',
          color: 'bg-green-500 hover:bg-green-600',
        });
        actions.push({
          label: 'Volver a borrador',
          status: 'draft',
          color: 'bg-gray-500 hover:bg-gray-600',
        });
        actions.push({
          label: 'Cancelar torneo',
          status: 'cancelled',
          color: 'bg-red-500 hover:bg-red-600',
        });
        break;

      case 'in_progress':
        actions.push({
          label: 'Finalizar torneo',
          status: 'completed',
          color: 'bg-purple-500 hover:bg-purple-600',
        });
        break;

      case 'completed':
      case 'cancelled':
        // No actions available for completed or cancelled tournaments
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
      <h2 className="font-heading text-[20px] text-white mb-4">ACCIONES</h2>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => handleStatusChange(action.status)}
            disabled={loading}
            className={`${action.color} text-white font-body text-[14px] py-2 px-6 rounded transition-colors disabled:opacity-50 flex items-center gap-2`}
          >
            {loading && <ButtonBallSpinner />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
