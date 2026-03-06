import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TimeslotForm } from '../../TimeslotForm';

interface EditTimeslotPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTimeslotPage({ params }: EditTimeslotPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: timeslot }, { data: courts }] = await Promise.all([
    supabase
      .from('timeslot_configs')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('courts')
      .select('*')
      .eq('status', 'active')
      .order('name'),
  ]);

  if (!timeslot || !courts) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">EDITAR HORARIO</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Modifica la configuración del horario
        </p>
      </div>

      <TimeslotForm timeslot={timeslot} courts={courts} />
    </div>
  );
}
