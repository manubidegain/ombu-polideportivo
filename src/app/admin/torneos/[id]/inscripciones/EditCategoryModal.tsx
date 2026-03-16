'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { X } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  max_teams: number;
  registrations_count?: number;
};

type Props = {
  registrationId: string;
  currentCategoryId: string;
  teamName: string;
  categories: Category[];
  onClose: () => void;
};

export function EditCategoryModal({
  registrationId,
  currentCategoryId,
  teamName,
  categories,
  onClose,
}: Props) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedCategoryId === currentCategoryId) {
        onClose();
        return;
      }

      const response = await fetch('/api/admin/tournament-registration/update-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          newCategoryId: selectedCategoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar categoría');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-heading text-[20px] text-white">CAMBIAR CATEGORÍA</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="font-body text-[14px] text-gray-400 mb-4">
              Equipo: <span className="text-white">{teamName}</span>
            </p>
          </div>

          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Nueva Categoría *
            </label>
            <select
              required
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              {categories.map((category) => {
                const isFull =
                  category.id !== currentCategoryId &&
                  (category.registrations_count || 0) >= category.max_teams;
                const isCurrent = category.id === currentCategoryId;

                return (
                  <option key={category.id} value={category.id} disabled={isFull}>
                    {category.name}
                    {isCurrent ? ' (Actual)' : ''}
                    {isFull ? ' (LLENO)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-4">
              <p className="font-body text-[14px] text-red-500">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading || selectedCategoryId === currentCategoryId}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <ButtonBallSpinner />}
              {loading ? 'CAMBIANDO...' : 'CAMBIAR CATEGORÍA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
