import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CourtsList } from './CourtsList';

export default async function CourtsPage() {
  const supabase = await createServerClient();

  const { data: courts, error } = await supabase
    .from('courts')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching courts:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[40px] text-white">CANCHAS</h1>
          <p className="font-body text-[16px] text-gray-400 mt-2">
            Administra las canchas del polideportivo
          </p>
        </div>
        <Link
          href="/admin/courts/new"
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          + NUEVA CANCHA
        </Link>
      </div>

      <CourtsList initialCourts={courts || []} />
    </div>
  );
}
