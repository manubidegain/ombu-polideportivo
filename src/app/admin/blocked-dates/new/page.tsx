import { createServerClient } from '@/lib/supabase/server';
import { BlockedDateForm } from '../BlockedDateForm';

export default async function NewBlockedDatePage() {
  const supabase = await createServerClient();

  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">BLOQUEAR FECHA</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Crea un bloqueo para torneos, mantenimiento u otros eventos
        </p>
      </div>

      <BlockedDateForm courts={courts || []} />
    </div>
  );
}
