'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2, Star } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type Photo = {
  id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  is_featured: boolean | null;
  uploaded_at: string | null;
};

type Props = {
  photos: Photo[];
  tournamentId: string;
  isAdmin: boolean;
};

export function PhotoGrid({ photos, tournamentId, isAdmin }: Props) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const getPublicUrl = (filePath: string) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('tournament-photos').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;

    setDeleting(photo.id);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tournament-photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('tournament_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      router.refresh();
    } catch (error: any) {
      alert('Error al eliminar foto: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (photo: Photo) => {
    try {
      const { error } = await supabase
        .from('tournament_photos')
        .update({ is_featured: !photo.is_featured })
        .eq('id', photo.id);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Error al actualizar foto: ' + error.message);
    }
  };

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={getPublicUrl(photo.file_path)}
              alt={photo.caption || photo.file_name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />

            {/* Featured Badge */}
            {photo.is_featured && (
              <div className="absolute top-2 right-2 bg-[#dbf228] text-[#1b1b1b] px-2 py-1 rounded text-[10px] font-heading">
                DESTACADA
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFeatured(photo);
                  }}
                  className={`p-2 sm:p-2.5 rounded ${photo.is_featured ? 'bg-[#dbf228] text-[#1b1b1b]' : 'bg-white/20 text-white'} hover:bg-white/30 transition-colors`}
                  title={photo.is_featured ? 'Quitar destacada' : 'Marcar como destacada'}
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5" fill={photo.is_featured ? 'currentColor' : 'none'} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo);
                  }}
                  disabled={deleting === photo.id}
                  className="p-2 sm:p-2.5 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deleting === photo.id ? (
                    <ButtonBallSpinner />
                  ) : (
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getPublicUrl(selectedPhoto.file_path)}
              alt={selectedPhoto.caption || selectedPhoto.file_name}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            {selectedPhoto.caption && (
              <div className="mt-4 text-center">
                <p className="font-body text-[16px] text-white">{selectedPhoto.caption}</p>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
