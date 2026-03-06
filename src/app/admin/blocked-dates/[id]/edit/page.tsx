import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BlockedDateForm } from '../../BlockedDateForm';

interface EditBlockedDatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlockedDatePage({ params }: EditBlockedDatePageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: blockedDate }, { data: courts }] = await Promise.all([
    supabase.from('blocked_dates').select('*').eq('id', id).single(),
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
  ]);

  if (!blockedDate) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">EDITAR BLOQUEO</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Modifica la configuración del bloqueo
        </p>
      </div>

      <BlockedDateForm blockedDate={blockedDate} courts={courts || []} />
    </div>
  );
}
