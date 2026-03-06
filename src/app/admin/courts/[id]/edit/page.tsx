import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CourtForm } from '../../CourtForm';

interface EditCourtPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCourtPage({ params }: EditCourtPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: court, error } = await supabase
    .from('courts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !court) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">EDITAR CANCHA</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Modifica la información de {court.name}
        </p>
      </div>

      <CourtForm court={court} />
    </div>
  );
}
