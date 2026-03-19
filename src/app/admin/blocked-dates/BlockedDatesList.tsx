'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type BlockedDate = Tables<'blocked_dates'> & {
  courts: { name: string } | null;
};
type Court = Tables<'courts'>;

interface BlockedDatesListProps {
  initialBlockedDates: BlockedDate[];
  courts: Court[];
}

export function BlockedDatesList({ initialBlockedDates, courts }: BlockedDatesListProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que quieres eliminar este bloqueo?')) {
      return;
    }

    setDeleting(id);
    const supabase = createClient();

    const { error } = await supabase.from('blocked_dates').delete().eq('id', id);

    if (error) {
      console.error('Error deleting blocked date:', error);
      alert('Error al eliminar el bloqueo.');
      setDeleting(null);
      return;
    }

    setBlockedDates(blockedDates.filter((b) => b.id !== id));
    setDeleting(null);
    router.refresh();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tournament: 'Torneo',
      maintenance: 'Mantenimiento',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: 'bg-purple-500/20 text-purple-400',
      maintenance: 'bg-orange-500/20 text-orange-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  if (blockedDates.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No hay fechas bloqueadas próximas
        </p>
        <Link
          href="/admin/blocked-dates/new"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          BLOQUEAR PRIMERA FECHA
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                FECHA
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                CANCHA
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                HORARIO
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                TIPO
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                RAZÓN
              </th>
              <th className="px-6 py-4 text-right font-heading text-[14px] text-white">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {blockedDates.map((blocked) => (
              <tr key={blocked.id} className="border-t border-white/10">
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {/* Parse date as YYYY-MM-DD to avoid timezone issues */}
                  {(() => {
                    const [year, month, day] = blocked.block_date.split('-');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-UY');
                  })()}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {blocked.courts?.name || 'Todas las canchas'}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {blocked.start_time && blocked.end_time
                    ? `${blocked.start_time} - ${blocked.end_time}`
                    : 'Todo el día'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full font-body text-[12px] ${getTypeColor(blocked.type)}`}>
                    {getTypeLabel(blocked.type)}
                  </span>
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {blocked.reason}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/blocked-dates/${blocked.id}/edit`}
                      className="bg-white/10 text-white font-body text-[12px] py-2 px-4 rounded hover:bg-white/20 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(blocked.id)}
                      disabled={deleting === blocked.id}
                      className="bg-red-500/20 text-red-400 font-body text-[12px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deleting === blocked.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
