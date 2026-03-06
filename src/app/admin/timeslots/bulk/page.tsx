import { createServerClient } from '@/lib/supabase/server';
import { BulkTimeslotForm } from './BulkTimeslotForm';
import { redirect } from 'next/navigation';

export default async function BulkTimeslotPage() {
  const supabase = await createServerClient();

  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (!courts || courts.length === 0) {
    redirect('/admin/courts/new');
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">CREAR HORARIOS EN LOTE</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Genera múltiples horarios de una sola vez
        </p>
      </div>

      <BulkTimeslotForm courts={courts} />
    </div>
  );
}
