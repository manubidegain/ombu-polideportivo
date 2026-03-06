'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Timeslot = Tables<'timeslot_configs'>;
type Court = Tables<'courts'>;

interface TimeslotFormProps {
  timeslot?: Timeslot;
  courts: Court[];
}

export function TimeslotForm({ timeslot, courts }: TimeslotFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    court_id: timeslot?.court_id || courts[0]?.id || '',
    day_of_week: timeslot?.day_of_week ?? 1,
    start_time: timeslot?.start_time || '08:00',
    duration_minutes: timeslot?.duration_minutes || 60,
    requires_lighting: timeslot?.requires_lighting ?? false,
    max_concurrent_bookings: timeslot?.max_concurrent_bookings || 1,
    is_active: timeslot?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (timeslot) {
        // Update existing timeslot
        const { error: updateError } = await supabase
          .from('timeslot_configs')
          .update(formData)
          .eq('id', timeslot.id);

        if (updateError) throw updateError;
      } else {
        // Create new timeslot
        const { error: insertError } = await supabase
          .from('timeslot_configs')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      router.push('/admin/timeslots');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving timeslot:', err);
      setError(err.message || 'Error al guardar el horario');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Court */}
        <div>
          <label htmlFor="court_id" className="block font-body text-[14px] text-white mb-2">
            Cancha <span className="text-red-400">*</span>
          </label>
          <select
            id="court_id"
            required
            value={formData.court_id}
            onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>

        {/* Day of week */}
        <div>
          <label htmlFor="day_of_week" className="block font-body text-[14px] text-white mb-2">
            Día de la semana <span className="text-red-400">*</span>
          </label>
          <select
            id="day_of_week"
            required
            value={formData.day_of_week}
            onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value={0}>Domingo</option>
            <option value={1}>Lunes</option>
            <option value={2}>Martes</option>
            <option value={3}>Miércoles</option>
            <option value={4}>Jueves</option>
            <option value={5}>Viernes</option>
            <option value={6}>Sábado</option>
          </select>
        </div>

        {/* Start time */}
        <div>
          <label htmlFor="start_time" className="block font-body text-[14px] text-white mb-2">
            Hora de inicio <span className="text-red-400">*</span>
          </label>
          <input
            id="start_time"
            type="time"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration_minutes" className="block font-body text-[14px] text-white mb-2">
            Duración <span className="text-red-400">*</span>
          </label>
          <select
            id="duration_minutes"
            required
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) as 60 | 90 })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value={60}>60 minutos (1 hora)</option>
            <option value={90}>90 minutos (1.5 horas)</option>
          </select>
        </div>

        {/* Requires lighting */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requires_lighting}
              onChange={(e) => setFormData({ ...formData, requires_lighting: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Requiere iluminación
            </span>
          </label>
          <p className="mt-2 ml-8 font-body text-[12px] text-gray-400">
            Marca esto si este horario requiere que las luces estén encendidas
          </p>
        </div>

        {/* Max concurrent bookings */}
        <div>
          <label htmlFor="max_concurrent_bookings" className="block font-body text-[14px] text-white mb-2">
            Máximo de reservas simultáneas <span className="text-red-400">*</span>
          </label>
          <input
            id="max_concurrent_bookings"
            type="number"
            required
            min="1"
            value={formData.max_concurrent_bookings}
            onChange={(e) => setFormData({ ...formData, max_concurrent_bookings: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Cuántas reservas se pueden hacer al mismo tiempo en este horario
          </p>
        </div>

        {/* Is active */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Horario activo
            </span>
          </label>
          <p className="mt-2 ml-8 font-body text-[12px] text-gray-400">
            Solo los horarios activos estarán disponibles para reservar
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-4">
          <p className="font-body text-[14px] text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-8 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'GUARDANDO...' : timeslot ? 'ACTUALIZAR' : 'CREAR HORARIO'}
        </button>
        <Link
          href="/admin/timeslots"
          className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
        >
          CANCELAR
        </Link>
      </div>
    </form>
  );
}
