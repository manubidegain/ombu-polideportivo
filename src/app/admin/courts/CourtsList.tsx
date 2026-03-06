'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Court = Tables<'courts'>;

interface CourtsListProps {
  initialCourts: Court[];
}

export function CourtsList({ initialCourts }: CourtsListProps) {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (courtId: string, courtName: string) => {
    if (!confirm(`¿Estás seguro que quieres eliminar "${courtName}"?`)) {
      return;
    }

    setDeleting(courtId);
    const supabase = createClient();

    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', courtId);

    if (error) {
      console.error('Error deleting court:', error);
      alert('Error al eliminar la cancha. Puede tener reservas asociadas.');
      setDeleting(null);
      return;
    }

    setCourts(courts.filter((c) => c.id !== courtId));
    setDeleting(null);
    router.refresh();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      padel_cerrada: 'Pádel Cerrada',
      padel_abierta: 'Pádel Abierta',
      futbol_5: 'Fútbol 5',
      futbol_7: 'Fútbol 7',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activa',
      inactive: 'Inactiva',
      maintenance: 'Mantenimiento',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'text-green-400',
      inactive: 'text-gray-400',
      maintenance: 'text-yellow-400',
    };
    return colors[status] || 'text-gray-400';
  };

  if (courts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No hay canchas creadas todavía
        </p>
        <Link
          href="/admin/courts/new"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          CREAR PRIMERA CANCHA
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
                NOMBRE
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                TIPO
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                TECHADA
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                ILUMINACIÓN
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                ESTADO
              </th>
              <th className="px-6 py-4 text-center font-heading text-[14px] text-white">
                CALENDAR
              </th>
              <th className="px-6 py-4 text-right font-heading text-[14px] text-white">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {courts.map((court) => (
              <tr key={court.id} className="border-t border-white/10">
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {court.name}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {getTypeLabel(court.type)}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {court.is_covered ? 'Sí' : 'No'}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {court.has_lighting ? 'Sí' : 'No'}
                </td>
                <td className={`px-6 py-4 font-body text-[14px] ${getStatusColor(court.status)}`}>
                  {getStatusLabel(court.status)}
                </td>
                <td className="px-6 py-4 text-center">
                  {court.calendar_sync_enabled ? (
                    <span className="inline-flex items-center gap-1 text-green-400" title={`Sincronizado con: ${court.calendar_id}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/courts/${court.id}/edit`}
                      className="bg-white/10 text-white font-body text-[12px] py-2 px-4 rounded hover:bg-white/20 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(court.id, court.name)}
                      disabled={deleting === court.id}
                      className="bg-red-500/20 text-red-400 font-body text-[12px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deleting === court.id ? 'Eliminando...' : 'Eliminar'}
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
