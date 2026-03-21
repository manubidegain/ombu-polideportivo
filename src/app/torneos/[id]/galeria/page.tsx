import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicPhotoGrid } from './PublicPhotoGrid';

export default async function TournamentGalleryPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch tournament
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('id, name, start_date, description')
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
    <div className="min-h-screen bg-[#ededed]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Volver al torneo
          </Link>
          <h1 className="font-heading text-[48px] text-[#1b1b1b] mb-2">GALERÍA DE FOTOS</h1>
          <p className="font-body text-[18px] text-gray-600">{tournament.name}</p>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {photos && photos.length > 0 ? (
            <PublicPhotoGrid photos={photos} tournamentId={id} />
          ) : (
            <div className="text-center py-16">
              <p className="font-body text-[16px] text-gray-600 mb-4">
                Todavía no hay fotos disponibles para este torneo.
              </p>
              <p className="font-body text-[14px] text-gray-500">
                Las fotos se subirán durante y después del torneo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
