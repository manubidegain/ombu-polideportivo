import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TimeslotsList } from './TimeslotsList';

export default async function TimeslotsPage() {
  const supabase = await createServerClient();

  const [{ data: timeslots }, { data: courts }] = await Promise.all([
    supabase
      .from('timeslot_configs')
      .select(`
        *,
        courts (name)
      `)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('courts')
      .select('*')
      .eq('status', 'active')
      .order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[40px] text-white">HORARIOS</h1>
          <p className="font-body text-[16px] text-gray-400 mt-2">
            Configura los horarios disponibles para cada cancha
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/timeslots/bulk"
            className="bg-white/10 text-white font-heading text-[18px] py-3 px-6 rounded-md hover:bg-white/20 transition-colors border border-[#dbf228]"
          >
            CREAR EN LOTE
          </Link>
          <Link
            href="/admin/timeslots/new"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
          >
            + NUEVO HORARIO
          </Link>
        </div>
      </div>

      {courts && courts.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <p className="font-body text-[14px] text-yellow-400">
            No hay canchas activas. <Link href="/admin/courts/new" className="underline">Crea una cancha</Link> primero.
          </p>
        </div>
      )}

      <TimeslotsList initialTimeslots={timeslots || []} courts={courts || []} />
    </div>
  );
}
