'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type BlockedDate = Tables<'blocked_dates'>;
type Court = Tables<'courts'>;

interface BlockedDateFormProps {
  blockedDate?: BlockedDate;
  courts: Court[];
}

export function BlockedDateForm({ blockedDate, courts }: BlockedDateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    court_id: blockedDate?.court_id || '',
    block_date: blockedDate?.block_date || '',
    start_time: blockedDate?.start_time || '',
    end_time: blockedDate?.end_time || '',
    reason: blockedDate?.reason || '',
    type: blockedDate?.type || 'other',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Prepare data - convert empty strings to null
    const dataToSave = {
      court_id: formData.court_id || null,
      block_date: formData.block_date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      reason: formData.reason,
      type: formData.type,
    };

    try {
      if (blockedDate) {
        const { error: updateError } = await supabase
          .from('blocked_dates')
          .update(dataToSave)
          .eq('id', blockedDate.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('blocked_dates')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      router.push('/admin/blocked-dates');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving blocked date:', err);
      setError(err.message || 'Error al guardar el bloqueo');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 space-y-6">
        {/* Court Selection */}
        <div>
          <label htmlFor="court_id" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
            Cancha (opcional)
          </label>
          <select
            id="court_id"
            value={formData.court_id}
            onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Todas las canchas</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-[11px] sm:text-[12px] text-gray-400">
            Si no seleccionas una cancha, se bloquearán todas
          </p>
        </div>

        {/* Block Date */}
        <div>
          <label htmlFor="block_date" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
            Fecha <span className="text-red-400">*</span>
          </label>
          <input
            id="block_date"
            type="date"
            required
            value={formData.block_date}
            onChange={(e) => setFormData({ ...formData, block_date: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="start_time" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
              Hora de inicio (opcional)
            </label>
            <input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
              Hora de fin (opcional)
            </label>
            <input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>
        </div>
        <p className="font-body text-[11px] sm:text-[12px] text-gray-400">
          Deja vacío para bloquear todo el día
        </p>

        {/* Type Selection */}
        <div>
          <label htmlFor="type" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
            Tipo de bloqueo <span className="text-red-400">*</span>
          </label>
          <select
            id="type"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="tournament">Torneo</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block font-body text-[13px] sm:text-[14px] text-white mb-2">
            Razón <span className="text-red-400">*</span>
          </label>
          <textarea
            id="reason"
            required
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-md font-body text-[14px] sm:text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228] resize-none"
            placeholder="Describe el motivo del bloqueo..."
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3 sm:p-4">
          <p className="font-body text-[13px] sm:text-[14px] text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] sm:text-[18px] py-3 px-6 sm:px-8 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
        >
          {loading ? 'GUARDANDO...' : blockedDate ? 'ACTUALIZAR' : 'CREAR BLOQUEO'}
        </button>
        <Link
          href="/admin/blocked-dates"
          className="bg-white/10 text-white font-heading text-[16px] sm:text-[18px] py-3 px-6 sm:px-8 rounded-md hover:bg-white/20 transition-colors text-center"
        >
          CANCELAR
        </Link>
      </div>
    </form>
  );
}
