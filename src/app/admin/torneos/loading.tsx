import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center">
      <LoadingSpinner size="lg" text="CARGANDO TORNEOS..." />
    </div>
  );
}
