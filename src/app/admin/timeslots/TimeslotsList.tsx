'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Timeslot = Tables<'timeslot_configs'> & {
  courts: { name: string } | null;
};
type Court = Tables<'courts'>;

interface TimeslotsListProps {
  initialTimeslots: Timeslot[];
  courts: Court[];
}

export function TimeslotsList({ initialTimeslots, courts }: TimeslotsListProps) {
  const [timeslots, setTimeslots] = useState<Timeslot[]>(initialTimeslots);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCourt, setFilterCourt] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const router = useRouter();

  const handleDelete = async (timeslotId: string) => {
    if (!confirm('¿Estás seguro que quieres eliminar este horario?')) {
      return;
    }

    setDeleting(timeslotId);
    const supabase = createClient();

    const { error } = await supabase
      .from('timeslot_configs')
      .delete()
      .eq('id', timeslotId);

    if (error) {
      console.error('Error deleting timeslot:', error);
      alert('Error al eliminar el horario.');
      setDeleting(null);
      return;
    }

    setTimeslots(timeslots.filter((t) => t.id !== timeslotId));
    setDeleting(null);
    router.refresh();
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  const filteredTimeslots = timeslots.filter((timeslot) => {
    if (filterCourt !== 'all' && timeslot.court_id !== filterCourt) return false;
    if (filterDay !== 'all' && timeslot.day_of_week.toString() !== filterDay) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por cancha
            </label>
            <select
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="all">Todas las canchas</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por día
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="all">Todos los días</option>
              <option value="0">Domingo</option>
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="font-body text-[14px] text-gray-400">
        Mostrando {filteredTimeslots.length} de {timeslots.length} horarios
      </p>

      {/* Timeslots table */}
      {filteredTimeslots.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
          <p className="font-body text-[16px] text-gray-400 mb-4">
            {timeslots.length === 0 ? 'No hay horarios configurados' : 'No se encontraron horarios con estos filtros'}
          </p>
          {timeslots.length === 0 && (
            <Link
              href="/admin/timeslots/new"
              className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
            >
              CREAR PRIMER HORARIO
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    CANCHA
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    DÍA
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    HORA INICIO
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    DURACIÓN
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    ILUMINACIÓN
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    MAX. RESERVAS
                  </th>
                  <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-right font-heading text-[14px] text-white">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTimeslots.map((timeslot) => (
                  <tr key={timeslot.id} className="border-t border-white/10">
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {timeslot.courts?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {getDayName(timeslot.day_of_week)}
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {timeslot.start_time}
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {timeslot.duration_minutes} min
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {timeslot.requires_lighting ? 'Sí' : 'No'}
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      {timeslot.max_concurrent_bookings}
                    </td>
                    <td className="px-6 py-4 font-body text-[14px] text-white">
                      <span className={timeslot.is_active ? 'text-green-400' : 'text-gray-400'}>
                        {timeslot.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/timeslots/${timeslot.id}/edit`}
                          className="bg-white/10 text-white font-body text-[12px] py-2 px-4 rounded hover:bg-white/20 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(timeslot.id)}
                          disabled={deleting === timeslot.id}
                          className="bg-red-500/20 text-red-400 font-body text-[12px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {deleting === timeslot.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
