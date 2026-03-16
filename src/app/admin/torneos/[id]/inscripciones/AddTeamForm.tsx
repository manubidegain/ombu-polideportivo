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
  tournamentId: string;
  categories: Category[];
  onClose: () => void;
};

export function AddTeamForm({ tournamentId, categories, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: categories[0]?.id || '',
    teamName: '',
    player1Email: '',
    player1Name: '',
    player2Email: '',
    player2Name: '',
    contactPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate emails are different
      if (formData.player1Email.toLowerCase() === formData.player2Email.toLowerCase()) {
        throw new Error('Los correos de los jugadores deben ser diferentes');
      }

      const response = await fetch('/api/admin/tournament-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          categoryId: formData.categoryId,
          teamName: formData.teamName,
          player1Email: formData.player1Email,
          player1Name: formData.player1Name,
          player2Email: formData.player2Email,
          player2Name: formData.player2Name,
          contactPhone: formData.contactPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear inscripción');
      }

      // Success - refresh and close
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
      <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-heading text-[24px] text-white">AGREGAR PAREJA</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Categoría *
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              {categories.map((category) => {
                const isFull = (category.registrations_count || 0) >= category.max_teams;
                return (
                  <option key={category.id} value={category.id} disabled={isFull}>
                    {category.name} {isFull ? '(LLENO)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Team Name */}
          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="Ej: Los Cracks"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>

          {/* Player 1 */}
          <div className="border border-white/10 rounded-lg p-4 space-y-4">
            <h3 className="font-heading text-[16px] text-[#dbf228]">JUGADOR 1</h3>
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.player1Email}
                onChange={(e) => setFormData({ ...formData, player1Email: e.target.value })}
                placeholder="jugador1@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.player1Name}
                onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
          </div>

          {/* Player 2 */}
          <div className="border border-white/10 rounded-lg p-4 space-y-4">
            <h3 className="font-heading text-[16px] text-[#dbf228]">JUGADOR 2</h3>
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.player2Email}
                onChange={(e) => setFormData({ ...formData, player2Email: e.target.value })}
                placeholder="jugador2@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.player2Name}
                onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })}
                placeholder="María González"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
          </div>

          {/* Contact Phone (Optional) */}
          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Teléfono de Contacto (opcional)
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="099 123 456"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
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
              className="flex-1 bg-white/10 text-white font-heading text-[16px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <ButtonBallSpinner />}
              {loading ? 'AGREGANDO...' : 'AGREGAR PAREJA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
