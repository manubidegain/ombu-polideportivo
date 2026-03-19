import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BlockedDatesList } from './BlockedDatesList';

export default async function BlockedDatesPage() {
  const supabase = await createServerClient();

  const [{ data: blockedDates }, { data: courts }] = await Promise.all([
    supabase
      .from('blocked_dates')
      .select(`
        *,
        courts (name)
      `)
      .gte('block_date', new Date().toISOString().split('T')[0])
      .order('block_date')
      .order('start_time'),
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] sm:text-[40px] text-white">FECHAS BLOQUEADAS</h1>
          <p className="font-body text-[14px] sm:text-[16px] text-gray-400 mt-2">
            Bloquea fechas y horarios para torneos, mantenimiento, etc.
          </p>
        </div>
        <Link
          href="/admin/blocked-dates/new"
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] sm:text-[18px] py-2 sm:py-3 px-4 sm:px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center whitespace-nowrap"
        >
          + BLOQUEAR FECHA
        </Link>
      </div>

      <BlockedDatesList initialBlockedDates={blockedDates || []} courts={courts || []} />
    </div>
  );
}
