'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Court = Tables<'courts'>;
type User = Pick<Tables<'user_profiles'>, 'id' | 'full_name' | 'email'>;

interface ReservationFormProps {
  courts: Court[];
  users: User[];
}

export function ReservationForm({ courts, users }: ReservationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    Array<{
      start_time: string;
      duration_minutes: number;
      price?: number;
      isAvailable?: boolean;
      existingCount?: number;
      maxBookings?: number;
    }>
  >([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const handleTimeSlotSelect = (slot: { start_time: string; duration_minutes: number; price?: number }) => {
    setFormData({
      ...formData,
      start_time: slot.start_time,
      duration_minutes: slot.duration_minutes,
      // Auto-fill price from timeslot if available, otherwise keep current price
      price: slot.price || formData.price,
    });
  };

  const [formData, setFormData] = useState<{
    user_id: string;
    court_id: string;
    reservation_date: string;
    start_time: string;
    duration_minutes: number;
    price: number;
    status: 'pending' | 'confirmed';
    notes: string;
    is_recurring: boolean;
    recurrence_end_date: string;
    recurrence_frequency: 'weekly' | 'biweekly';
    manual_name: string;
    manual_email: string;
    manual_phone: string;
  }>({
    user_id: '',
    court_id: '',
    reservation_date: '',
    start_time: '',
    duration_minutes: 60,
    price: 0,
    status: 'confirmed',
    notes: '',
    is_recurring: false,
    recurrence_end_date: '',
    recurrence_frequency: 'weekly',
    // Manual fields (when no user is selected)
    manual_name: '',
    manual_email: '',
    manual_phone: '',
  });

  const calculatePrice = (
    rules: Tables<'pricing_rules'>[],
    courtId: string,
    timeslotId: string,
    dayOfWeek: number,
    date: string,
    durationMinutes: number
  ): number => {
    // Find the first matching rule (they're already sorted by priority)
    for (const rule of rules) {
      // Check court match
      if (rule.court_id && rule.court_id !== courtId) continue;

      // Check timeslot match
      if (rule.timeslot_config_id && rule.timeslot_config_id !== timeslotId) continue;

      // Check day of week match
      if (rule.day_of_week !== null && rule.day_of_week !== dayOfWeek) continue;

      // Check duration match
      if (rule.duration_minutes !== null && rule.duration_minutes !== durationMinutes) continue;

      // Check date range
      if (rule.start_date && date < rule.start_date) continue;
      if (rule.end_date && date > rule.end_date) continue;

      return rule.price;
    }

    // Default price if no rule matches
    return 1000;
  };

  const handleDateOrCourtChange = async (
    field: 'reservation_date' | 'court_id',
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // If both date and court are selected, fetch available slots with pricing
    if (newFormData.reservation_date && newFormData.court_id) {
      setLoadingSlots(true);
      const supabase = createClient();

      // Fetch timeslots
      const { data: timeslots, error: slotsError } = await supabase
        .from('timeslot_configs')
        .select('id, start_time, duration_minutes, day_of_week, max_concurrent_bookings')
        .eq('court_id', newFormData.court_id)
        .eq('is_active', true);

      if (slotsError) {
        console.error('Error fetching timeslots:', slotsError);
        setLoadingSlots(false);
        return;
      }

      // Fetch existing reservations for this date and court
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('start_time, duration_minutes')
        .eq('court_id', newFormData.court_id)
        .eq('reservation_date', newFormData.reservation_date)
        .in('status', ['confirmed', 'pending']);

      // Fetch blocked dates
      const { data: blockedDates } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('court_id', newFormData.court_id)
        .eq('block_date', newFormData.reservation_date);

      // Fetch pricing rules
      const { data: pricingRules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      // Filter by day of week and calculate prices
      const selectedDate = new Date(newFormData.reservation_date);
      const dayOfWeek = selectedDate.getDay();
      const dateStr = newFormData.reservation_date;

      const availableForDay = timeslots
        ?.filter((slot) => slot.day_of_week === dayOfWeek)
        .map((slot) => {
          // Check if slot is blocked
          const isBlocked = blockedDates?.some((blocked) => {
            if (!blocked.start_time && !blocked.end_time) return true; // Entire day blocked
            if (!blocked.start_time || !blocked.end_time) return false;
            return slot.start_time >= blocked.start_time && slot.start_time < blocked.end_time;
          });

          // Count existing reservations for this slot
          const existingCount = existingReservations?.filter(
            (r) => r.start_time === slot.start_time
          ).length || 0;

          // Check if slot is available
          const isAvailable = !isBlocked && existingCount < (slot.max_concurrent_bookings || 1);

          return {
            start_time: slot.start_time,
            duration_minutes: slot.duration_minutes,
            price: calculatePrice(
              pricingRules || [],
              newFormData.court_id,
              slot.id,
              dayOfWeek,
              dateStr,
              slot.duration_minutes
            ),
            isAvailable,
            existingCount,
            maxBookings: slot.max_concurrent_bookings || 1,
          };
        }) || [];

      setAvailableSlots(availableForDay);
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      // Get user info if user is selected
      let userData = null;
      if (formData.user_id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', formData.user_id)
          .single();
        userData = data;
      }

      // Get timeslot config ID
      const selectedDate = new Date(formData.reservation_date);
      const dayOfWeek = selectedDate.getDay();
      const dateStr = formData.reservation_date;

      const { data: timeslotConfig } = await supabase
        .from('timeslot_configs')
        .select('id')
        .eq('court_id', formData.court_id)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', formData.start_time)
        .single();

      if (!timeslotConfig) {
        throw new Error('No se encontró la configuración de horario');
      }

      // Calculate price if not manually set
      let finalPrice = formData.price;

      if (finalPrice === 0) {
        // Fetch pricing rules
        const { data: pricingRules } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        finalPrice = calculatePrice(
          pricingRules || [],
          formData.court_id,
          timeslotConfig.id,
          dayOfWeek,
          dateStr,
          formData.duration_minutes
        );
      }

      const baseReservation = {
        user_id: formData.user_id || null,
        court_id: formData.court_id,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        price: finalPrice,
        status: formData.status,
        notes: formData.notes || null,
        customer_name: formData.user_id ? (userData?.full_name || '') : formData.manual_name,
        customer_email: formData.user_id ? (userData?.email || '') : (formData.manual_email || ''),
        customer_phone: formData.user_id ? (userData?.phone || '') : (formData.manual_phone || ''),
        requires_lighting: false,
        payment_status: formData.status === 'confirmed' ? 'paid' : 'pending',
        timeslot_config_id: timeslotConfig.id,
      };

      if (!formData.is_recurring) {
        // Simple reservation
        const { data: newReservation, error: insertError } = await supabase.from('reservations').insert([
          {
            ...baseReservation,
            reservation_date: formData.reservation_date,
            is_recurring: false,
          },
        ]).select().single();

        if (insertError) throw insertError;

        // Sync with Google Calendar (fire and forget)
        if (newReservation) {
          fetch('/api/calendar/sync-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: newReservation.id,
            }),
          }).catch(err => console.error('Failed to sync with Google Calendar:', err));
        }
      } else {
        // Recurring reservation
        if (!formData.recurrence_end_date) {
          throw new Error('Debes especificar la fecha de fin para reservas recurrentes');
        }

        // Generate all dates first to check for conflicts
        const allDates = [];
        const startDate = new Date(formData.reservation_date);
        const endDate = new Date(formData.recurrence_end_date);
        const increment = formData.recurrence_frequency === 'weekly' ? 7 : 14;

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          allDates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + increment);
        }

        // Check for conflicts with existing reservations
        const { data: existingReservations, error: checkError } = await supabase
          .from('reservations')
          .select('reservation_date, customer_name')
          .eq('court_id', formData.court_id)
          .eq('start_time', formData.start_time)
          .in('reservation_date', allDates)
          .in('status', ['confirmed', 'pending']);

        if (checkError) throw checkError;

        if (existingReservations && existingReservations.length > 0) {
          const conflictDates = existingReservations
            .map((r) => `${r.reservation_date} (${r.customer_name})`)
            .join(', ');
          throw new Error(
            `Conflicto: Ya existen reservas en las siguientes fechas: ${conflictDates}`
          );
        }

        // Check for blocked dates
        const { data: blockedDates, error: blockError } = await supabase
          .from('blocked_dates')
          .select('block_date, reason')
          .eq('court_id', formData.court_id)
          .in('block_date', allDates);

        if (blockError) throw blockError;

        if (blockedDates && blockedDates.length > 0) {
          const blockedList = blockedDates
            .map((b) => `${b.block_date} (${b.reason || 'Bloqueado'})`)
            .join(', ');
          throw new Error(
            `Fechas bloqueadas encontradas: ${blockedList}. Por favor ajusta el rango de fechas.`
          );
        }

        // If no conflicts, create parent reservation
        const { data: parentReservation, error: parentError } = await supabase
          .from('reservations')
          .insert([
            {
              ...baseReservation,
              reservation_date: formData.reservation_date,
              is_recurring: true,
              recurrence_end_date: formData.recurrence_end_date,
            },
          ])
          .select()
          .single();

        if (parentError) throw parentError;

        // Generate child reservations (skip first date as it's the parent)
        const childReservations = allDates.slice(1).map((date) => ({
          ...baseReservation,
          reservation_date: date,
          is_recurring: true,
          recurrence_parent_id: parentReservation.id,
          recurrence_end_date: formData.recurrence_end_date,
        }));

        if (childReservations.length > 0) {
          const { data: createdChildren, error: childError } = await supabase
            .from('reservations')
            .insert(childReservations)
            .select();

          if (childError) throw childError;

          // Sync all child reservations with Google Calendar
          if (createdChildren) {
            createdChildren.forEach((reservation) => {
              fetch('/api/calendar/sync-reservation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reservationId: reservation.id,
                }),
              }).catch(err => console.error('Failed to sync child reservation with Google Calendar:', err));
            });
          }
        }

        // Sync parent reservation with Google Calendar
        if (parentReservation) {
          fetch('/api/calendar/sync-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: parentReservation.id,
            }),
          }).catch(err => console.error('Failed to sync parent reservation with Google Calendar:', err));
        }
      }

      router.push('/admin/reservations');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Error al crear la reserva');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* User Selection */}
        <div>
          <label htmlFor="user_id" className="block font-body text-[14px] text-white mb-2">
            Usuario (opcional)
          </label>
          <select
            id="user_id"
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Sin usuario / Ingresar manualmente</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
          <p className="font-body text-[12px] text-gray-400 mt-1">
            Si no seleccionas un usuario, ingresa los datos manualmente abajo
          </p>
        </div>

        {/* Manual Customer Details (shown when no user selected) */}
        {!formData.user_id && (
          <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-4 space-y-4">
            <h3 className="font-heading text-[14px] text-[#dbf228]">
              DATOS DEL CLIENTE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="manual_name" className="block font-body text-[12px] text-white mb-2">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  id="manual_name"
                  type="text"
                  required={!formData.user_id}
                  value={formData.manual_name}
                  onChange={(e) => setFormData({ ...formData, manual_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label htmlFor="manual_email" className="block font-body text-[12px] text-white mb-2">
                  Email (opcional)
                </label>
                <input
                  id="manual_email"
                  type="email"
                  value={formData.manual_email}
                  onChange={(e) => setFormData({ ...formData, manual_email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  placeholder="juan@email.com"
                />
              </div>
              <div>
                <label htmlFor="manual_phone" className="block font-body text-[12px] text-white mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  id="manual_phone"
                  type="tel"
                  value={formData.manual_phone}
                  onChange={(e) => setFormData({ ...formData, manual_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  placeholder="+598 95 123 456"
                />
              </div>
            </div>
          </div>
        )}

        {/* Court Selection */}
        <div>
          <label htmlFor="court_id" className="block font-body text-[14px] text-white mb-2">
            Cancha <span className="text-red-400">*</span>
          </label>
          <select
            id="court_id"
            required
            value={formData.court_id}
            onChange={(e) => handleDateOrCourtChange('court_id', e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Selecciona una cancha</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reservation Date */}
        <div>
          <label htmlFor="reservation_date" className="block font-body text-[14px] text-white mb-2">
            Fecha <span className="text-red-400">*</span>
          </label>
          <input
            id="reservation_date"
            type="date"
            required
            value={formData.reservation_date}
            onChange={(e) => handleDateOrCourtChange('reservation_date', e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
        </div>

        {/* Available Slots */}
        {loadingSlots && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="font-body text-[14px] text-gray-400">Cargando horarios disponibles...</p>
          </div>
        )}

        {!loadingSlots && availableSlots.length > 0 && (
          <div>
            <label className="block font-body text-[14px] text-white mb-2">
              Horarios para este día
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot, index) => {
                const isSelected = formData.start_time === slot.start_time;
                const isAvailable = slot.isAvailable !== false;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                    disabled={!isAvailable}
                    className={`px-3 py-2 rounded-md font-body text-[14px] transition-colors flex flex-col items-center relative ${
                      isSelected
                        ? 'bg-[#dbf228] text-[#1b1b1b]'
                        : isAvailable
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-red-500/20 text-red-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{slot.start_time}</span>
                    {slot.price && isAvailable && (
                      <span className="text-[11px] opacity-80">${slot.price}</span>
                    )}
                    {!isAvailable && (
                      <span className="text-[10px]">
                        {slot.existingCount}/{slot.maxBookings}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white/10 rounded"></div>
                <span className="text-gray-400">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/20 rounded"></div>
                <span className="text-gray-400">No disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#dbf228] rounded"></div>
                <span className="text-gray-400">Seleccionado</span>
              </div>
            </div>
          </div>
        )}

        {!loadingSlots &&
          formData.reservation_date &&
          formData.court_id &&
          availableSlots.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <p className="font-body text-[14px] text-yellow-400">
                No hay horarios configurados para esta cancha en este día de la semana
              </p>
            </div>
          )}

        {/* Manual Time Input (fallback) */}
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
            <label htmlFor="duration_minutes" className="block font-body text-[14px] text-white mb-2">
              Duración (minutos) <span className="text-red-400">*</span>
            </label>
            <input
              id="duration_minutes"
              type="number"
              required
              min="30"
              step="30"
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block font-body text-[14px] text-white mb-2">
            Precio
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-[16px] text-gray-400">
              $
            </span>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : 0 })}
              className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              placeholder="Se toma del timeslot configurado"
            />
          </div>
          {formData.price > 0 && (
            <p className="font-body text-[12px] text-[#dbf228] mt-1">
              ✓ Precio establecido: ${formData.price}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block font-body text-[14px] text-white mb-2">
            Estado <span className="text-red-400">*</span>
          </label>
          <select
            id="status"
            required
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as 'pending' | 'confirmed' })
            }
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
          </select>
        </div>

        {/* Recurring Reservation Toggle */}
        <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) =>
                setFormData({ ...formData, is_recurring: e.target.checked })
              }
              className="w-5 h-5 rounded border-2 border-[#dbf228] bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228] cursor-pointer"
            />
            <span className="font-body text-[14px] text-white">
              Reserva recurrente (repetir semanalmente o quincenalmente)
            </span>
          </label>
        </div>

        {/* Recurring Options */}
        {formData.is_recurring && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
            <h3 className="font-heading text-[16px] text-[#dbf228] mb-2">
              CONFIGURACIÓN DE RECURRENCIA
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recurrence_frequency" className="block font-body text-[14px] text-white mb-2">
                  Frecuencia <span className="text-red-400">*</span>
                </label>
                <select
                  id="recurrence_frequency"
                  value={formData.recurrence_frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence_frequency: e.target.value as 'weekly' | 'biweekly',
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                </select>
              </div>

              <div>
                <label htmlFor="recurrence_end_date" className="block font-body text-[14px] text-white mb-2">
                  Fecha de fin <span className="text-red-400">*</span>
                </label>
                <input
                  id="recurrence_end_date"
                  type="date"
                  required={formData.is_recurring}
                  min={formData.reservation_date}
                  value={formData.recurrence_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence_end_date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>
            </div>

            {formData.reservation_date && formData.recurrence_end_date && (
              <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-3">
                <p className="font-body text-[12px] text-[#dbf228]">
                  ℹ️ Se crearán aproximadamente{' '}
                  {Math.ceil(
                    (new Date(formData.recurrence_end_date).getTime() -
                      new Date(formData.reservation_date).getTime()) /
                      (1000 * 60 * 60 * 24 * (formData.recurrence_frequency === 'weekly' ? 7 : 14))
                  ) + 1}{' '}
                  reservas desde {formData.reservation_date} hasta{' '}
                  {formData.recurrence_end_date}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block font-body text-[14px] text-white mb-2">
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228] resize-none"
            placeholder="Información adicional sobre la reserva..."
          />
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
          {loading ? 'CREANDO...' : 'CREAR RESERVA'}
        </button>
        <Link
          href="/admin/reservations"
          className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
        >
          CANCELAR
        </Link>
      </div>
    </form>
  );
}
