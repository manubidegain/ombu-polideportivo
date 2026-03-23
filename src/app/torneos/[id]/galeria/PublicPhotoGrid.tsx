'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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
};

export function PublicPhotoGrid({ photos, tournamentId }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [carouselImageLoading, setCarouselImageLoading] = useState(false);
  const supabase = createClient();
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Get thumbnail URL for grid (small, optimized)
  const getThumbnailUrl = (filePath: string) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('tournament-photos').getPublicUrl(filePath, {
      transform: {
        width: 400,
        height: 400,
        resize: 'cover',
        quality: 80,
      },
    });
    return publicUrl;
  };

  // Get full-quality URL for carousel
  const getFullQualityUrl = (filePath: string) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('tournament-photos').getPublicUrl(filePath, {
      transform: {
        width: 1920,
        height: 1920,
        resize: 'contain',
        quality: 90,
      },
    });
    return publicUrl;
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setCarouselImageLoading(true);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setCarouselImageLoading(false);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setCarouselImageLoading(true);
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setCarouselImageLoading(true);
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Handle touch events for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedIndex]);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  // Lazy loading for grid images
  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setLoadedImages((prev) => new Set([...prev, index]));
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            data-index={index}
            ref={(el) => {
              if (el && observerRef.current && !loadedImages.has(index)) {
                observerRef.current.observe(el);
              }
            }}
            className="relative group aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {loadedImages.has(index) ? (
              <img
                src={getThumbnailUrl(photo.file_path)}
                alt={photo.caption || photo.file_name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse bg-gray-300 w-full h-full" />
              </div>
            )}

            {/* Featured Badge */}
            {photo.is_featured && (
              <div className="absolute top-2 right-2 bg-[#dbf228] text-[#1b1b1b] px-2 py-1 rounded text-[10px] font-heading">
                DESTACADA
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      {/* Lightbox Carousel */}
      {selectedPhoto && selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors z-10"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next Button */}
          {selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors z-10"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-7xl w-full px-4 md:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading Spinner */}
            {carouselImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}

            <img
              src={getFullQualityUrl(selectedPhoto.file_path)}
              alt={selectedPhoto.caption || selectedPhoto.file_name}
              className={`w-full h-auto max-h-[85vh] object-contain rounded-lg transition-opacity ${
                carouselImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setCarouselImageLoading(false)}
            />

            {/* Caption and Counter */}
            <div className="mt-4 space-y-2">
              {selectedPhoto.caption && (
                <p className="font-body text-[16px] text-white text-center">
                  {selectedPhoto.caption}
                </p>
              )}
              <p className="font-body text-[14px] text-gray-400 text-center">
                {selectedIndex + 1} / {photos.length}
              </p>
            </div>
          </div>

          {/* Swipe Hint (Mobile Only) */}
          <div className="absolute bottom-8 left-0 right-0 text-center md:hidden">
            <p className="font-body text-[12px] text-gray-400">
              Deslizá para ver más fotos
            </p>
          </div>

          {/* Keyboard Hint (Desktop Only) */}
          <div className="hidden md:block absolute bottom-8 left-0 right-0 text-center">
            <p className="font-body text-[12px] text-gray-400">
              Usá las flechas del teclado para navegar
            </p>
          </div>
        </div>
      )}
    </>
  );
}
