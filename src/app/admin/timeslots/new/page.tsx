import { createServerClient } from '@/lib/supabase/server';
import { TimeslotForm } from '../TimeslotForm';
import { redirect } from 'next/navigation';

export default async function NewTimeslotPage() {
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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">NUEVO HORARIO</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Configura un nuevo horario disponible
        </p>
      </div>

      <TimeslotForm courts={courts} />
    </div>
  );
}
