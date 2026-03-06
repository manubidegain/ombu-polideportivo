'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Court = Tables<'courts'>;

interface BulkTimeslotFormProps {
  courts: Court[];
}

export function BulkTimeslotForm({ courts }: BulkTimeslotFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    court_ids: [] as string[],
    days_of_week: [] as number[],
    start_time: '08:00',
    end_time: '22:00',
    duration_minutes: 60 as 60 | 90,
    requires_lighting: false,
    max_concurrent_bookings: 1,
    is_active: true,
  });

  const toggleCourt = (courtId: string) => {
    setFormData((prev) => ({
      ...prev,
      court_ids: prev.court_ids.includes(courtId)
        ? prev.court_ids.filter((id) => id !== courtId)
        : [...prev.court_ids, courtId],
    }));
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const toggleAllCourts = () => {
    if (formData.court_ids.length === courts.length) {
      setFormData({ ...formData, court_ids: [] });
    } else {
      setFormData({ ...formData, court_ids: courts.map((c) => c.id) });
    }
  };

  const toggleAllDays = () => {
    if (formData.days_of_week.length === 7) {
      setFormData({ ...formData, days_of_week: [] });
    } else {
      setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] });
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // If end time is before start time, it means it crosses midnight
    // Add 24 hours (1440 minutes) to end time
    if (endMinutes <= currentMinutes) {
      endMinutes += 1440; // 24 * 60
    }

    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60) % 24; // Use modulo to wrap around 24 hours
      const min = currentMinutes % 60;
      slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      currentMinutes += formData.duration_minutes;
    }

    return slots;
  };

  const handlePreview = () => {
    if (formData.court_ids.length === 0) {
      setError('Selecciona al menos una cancha');
      return;
    }

    if (formData.days_of_week.length === 0) {
      setError('Selecciona al menos un día');
      return;
    }

    const timeSlots = generateTimeSlots();
    const previewData = [];

    for (const courtId of formData.court_ids) {
      const court = courts.find((c) => c.id === courtId);
      for (const day of formData.days_of_week) {
        for (const time of timeSlots) {
          previewData.push({
            court_name: court?.name,
            day_of_week: day,
            start_time: time,
            duration_minutes: formData.duration_minutes,
          });
        }
      }
    }

    setPreview(previewData);
    setShowPreview(true);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const timeSlots = generateTimeSlots();
    const timeslotsToInsert = [];

    for (const courtId of formData.court_ids) {
      for (const day of formData.days_of_week) {
        for (const time of timeSlots) {
          timeslotsToInsert.push({
            court_id: courtId,
            day_of_week: day,
            start_time: time,
            duration_minutes: formData.duration_minutes,
            requires_lighting: formData.requires_lighting,
            max_concurrent_bookings: formData.max_concurrent_bookings,
            is_active: formData.is_active,
          });
        }
      }
    }

    try {
      const { error: insertError } = await supabase
        .from('timeslot_configs')
        .insert(timeslotsToInsert);

      if (insertError) throw insertError;

      router.push('/admin/timeslots');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating timeslots:', err);
      setError(err.message || 'Error al crear los horarios');
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[day];
  };

  const getDayFullName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Court Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block font-body text-[14px] text-white">
              Canchas <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={toggleAllCourts}
              className="font-body text-[12px] text-[#dbf228] hover:underline"
            >
              {formData.court_ids.length === courts.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {courts.map((court) => (
              <label key={court.id} className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.court_ids.includes(court.id)}
                  onChange={() => toggleCourt(court.id)}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
                />
                <span className="font-body text-[14px] text-white">
                  {court.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Days of Week Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block font-body text-[14px] text-white">
              Días de la semana <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={toggleAllDays}
              className="font-body text-[12px] text-[#dbf228] hover:underline"
            >
              {formData.days_of_week.length === 7 ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-3 px-2 rounded-md font-body text-[12px] transition-colors ${
                  formData.days_of_week.includes(day)
                    ? 'bg-[#dbf228] text-[#1b1b1b]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {getDayName(day)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label htmlFor="end_time" className="block font-body text-[14px] text-white mb-2">
                Hora de fin <span className="text-red-400">*</span>
              </label>
              <input
                id="end_time"
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>
          </div>
          <p className="mt-2 font-body text-[12px] text-gray-400">
            💡 Puedes crear horarios que cruzan la medianoche (ej: 17:00 a 01:00 del día siguiente)
          </p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration_minutes" className="block font-body text-[14px] text-white mb-2">
            Duración de cada horario <span className="text-red-400">*</span>
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

        {/* Options */}
        <div className="space-y-3">
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

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Horarios activos
            </span>
          </label>
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
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-4">
          <p className="font-body text-[14px] text-red-400">{error}</p>
        </div>
      )}

      {/* Preview */}
      {showPreview && preview.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="font-heading text-[20px] text-white mb-4">
            VISTA PREVIA ({preview.length} horarios)
          </h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-heading text-[12px] text-white">CANCHA</th>
                  <th className="px-4 py-2 text-left font-heading text-[12px] text-white">DÍA</th>
                  <th className="px-4 py-2 text-left font-heading text-[12px] text-white">HORA</th>
                  <th className="px-4 py-2 text-left font-heading text-[12px] text-white">DURACIÓN</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((slot, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-4 py-2 font-body text-[12px] text-white">{slot.court_name}</td>
                    <td className="px-4 py-2 font-body text-[12px] text-white">{getDayFullName(slot.day_of_week)}</td>
                    <td className="px-4 py-2 font-body text-[12px] text-white">{slot.start_time}</td>
                    <td className="px-4 py-2 font-body text-[12px] text-white">{slot.duration_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="mt-4 font-body text-[12px] text-gray-400 text-center">
                ... y {preview.length - 50} horarios más
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!showPreview ? (
          <button
            type="button"
            onClick={handlePreview}
            className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
          >
            VISTA PREVIA
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-8 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CREANDO...' : `CREAR ${preview.length} HORARIOS`}
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              disabled={loading}
              className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
            >
              MODIFICAR
            </button>
          </>
        )}
        <Link
          href="/admin/timeslots"
          className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
        >
          CANCELAR
        </Link>
      </div>
    </div>
  );
}
