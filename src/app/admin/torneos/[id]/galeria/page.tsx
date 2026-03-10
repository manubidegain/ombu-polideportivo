import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGrid } from './PhotoGrid';

export default async function TournamentGalleryAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createServerClient();

  // Fetch tournament
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('id, name, start_date')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from('tournament_photos')
    .select('*')
    .eq('tournament_id', id)
    .order('is_featured', { ascending: false })
    .order('display_order')
    .order('uploaded_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver al torneo
          </Link>
          <h1 className="font-heading text-[48px] text-white mb-2">GALERÍA DE FOTOS</h1>
          <p className="font-body text-[16px] text-gray-400">{tournament.name}</p>
        </div>

        {/* Photo Uploader */}
        <div className="mb-8">
          <PhotoUploader tournamentId={id} />
        </div>

        {/* Photo Grid */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="font-heading text-[24px] text-white mb-6">
            FOTOS ({photos?.length || 0})
          </h2>

          {photos && photos.length > 0 ? (
            <PhotoGrid photos={photos} tournamentId={id} isAdmin={true} />
          ) : (
            <p className="text-center text-gray-400 py-8">
              No hay fotos todavía. Usa el cargador arriba para agregar fotos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
