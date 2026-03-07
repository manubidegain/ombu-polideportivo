'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/database.types';
import { addDays, format, startOfWeek, isBefore, startOfDay, isToday, parse, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { LoadingSpinner, ButtonSpinner } from '@/components/common/LoadingSpinner';

type Court = Tables<'courts'>;
type TimeslotConfig = Tables<'timeslot_configs'>;
type Reservation = Tables<'reservations'>;
type BlockedDate = Tables<'blocked_dates'>;

interface ReservationCalendarProps {
  courts: Court[];
  userId: string | null;
}

interface AvailableSlot {
  timeslot: TimeslotConfig;
  isAvailable: boolean;
  isBlocked: boolean;
  isPastTime: boolean;
  price: number;
  existingReservationsCount: number;
}

export function ReservationCalendar({ courts, userId }: ReservationCalendarProps) {
  const router = useRouter();
  const [selectedCourt, setSelectedCourt] = useState<string>(courts[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeslotConfig | null>(null);
  const [reserving, setReserving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [successReservation, setSuccessReservation] = useState<{
    court: string;
    date: string;
    time: string;
    duration: number;
    price: number;
  } | null>(null);

  // Generate week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCourt, selectedDate]);

  // Restore pending reservation after login
  useEffect(() => {
    if (userId) {
      const pendingReservation = localStorage.getItem('pendingReservation');
      if (pendingReservation) {
        try {
          const { courtId, date, timeslotId } = JSON.parse(pendingReservation);

          // Restore the court and date
          setSelectedCourt(courtId);
          setSelectedDate(new Date(date));

          // Wait a bit for the slots to load, then open the reservation modal
          setTimeout(() => {
            const slot = availableSlots.find((s) => s.timeslot.id === timeslotId);
            if (slot && slot.isAvailable) {
              setSelectedSlot(slot.timeslot);
            }
            // Clear the pending reservation
            localStorage.removeItem('pendingReservation');
          }, 500);
        } catch (error) {
          console.error('Error restoring pending reservation:', error);
          localStorage.removeItem('pendingReservation');
        }
      }
    }
  }, [userId, availableSlots]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    const supabase = createClient();
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Load timeslots for this court and day
    const { data: timeslots } = await supabase
      .from('timeslot_configs')
      .select('*')
      .eq('court_id', selectedCourt)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time');

    // Load existing reservations
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('court_id', selectedCourt)
      .eq('reservation_date', dateStr)
      .eq('status', 'confirmed');

    // Load blocked dates
    const { data: blockedDates } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('block_date', dateStr)
      .or(`court_id.eq.${selectedCourt},court_id.is.null`);

    // Load pricing rules
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Process each timeslot
    const slots: AvailableSlot[] = (timeslots || []).map((timeslot) => {
      // Check if timeslot is in the past
      let isPastTime = false;
      if (isToday(selectedDate)) {
        const now = new Date();
        const [hours, minutes] = timeslot.start_time.split(':').map(Number);
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hours, minutes, 0, 0);
        isPastTime = slotDateTime < now;
      }

      // Check if blocked
      const isBlocked = isPastTime || (blockedDates || []).some((blocked) => {
        if (!blocked.start_time || !blocked.end_time) return true; // All day block
        return timeslot.start_time >= blocked.start_time && timeslot.start_time < blocked.end_time;
      });

      // Count existing reservations
      const existingReservationsCount =
        reservations?.filter((r) => r.start_time === timeslot.start_time).length || 0;

      // Check availability
      const isAvailable =
        !isBlocked && existingReservationsCount < (timeslot.max_concurrent_bookings || 1);

      // Calculate price using pricing rules
      const price = calculatePrice(
        pricingRules || [],
        selectedCourt,
        timeslot.id,
        dayOfWeek,
        dateStr,
        timeslot.duration_minutes
      );

      return {
        timeslot,
        isAvailable,
        isBlocked,
        isPastTime,
        price,
        existingReservationsCount,
      };
    });

    setAvailableSlots(slots);
    setLoading(false);
  };

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

  const handleReserve = async (slot: AvailableSlot) => {
    // If user is not logged in, save reservation intent and redirect to login
    if (!userId) {
      // Save the reservation details to localStorage
      localStorage.setItem(
        'pendingReservation',
        JSON.stringify({
          courtId: selectedCourt,
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeslotId: slot.timeslot.id,
        })
      );
      window.location.href = '/auth/login?redirect=/reservas';
      return;
    }
    setSelectedSlot(slot.timeslot);
  };

  const confirmReservation = async () => {
    if (!selectedSlot) return;

    setReserving(true);
    const supabase = createClient();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Get the price for this slot
    const slotData = availableSlots.find((s) => s.timeslot.id === selectedSlot.id);
    const price = slotData?.price || 1000;

    try {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get user profile for additional info
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      const userEmail = user.email || '';
      const userPhone = profile?.phone || '';

      // Create reservation
      const { data: newReservation, error } = await supabase.from('reservations').insert([
        {
          user_id: userId,
          court_id: selectedCourt,
          reservation_date: dateStr,
          start_time: selectedSlot.start_time,
          duration_minutes: selectedSlot.duration_minutes,
          timeslot_config_id: selectedSlot.id,
          price: price,
          status: 'confirmed',
          customer_name: userName,
          customer_email: userEmail,
          customer_phone: userPhone,
          requires_lighting: selectedSlot.requires_lighting || false,
          payment_status: 'pending',
        },
      ]).select().single();

      if (error) throw error;

      // Sync with Google Calendar (fire and forget, don't block on failure)
      if (newReservation) {
        fetch('/api/calendar/sync-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: newReservation.id,
          }),
        }).catch(err => console.error('Failed to sync with Google Calendar:', err));
      }

      // Send confirmation email (don't wait for it, fire and forget)
      fetch('/api/reservations/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          userName: userName,
          courtName: selectedCourtData?.name || 'Cancha',
          date: dateStr,
          startTime: selectedSlot.start_time,
          duration: selectedSlot.duration_minutes,
          price: price,
        }),
      }).catch(err => console.error('Failed to send confirmation email:', err));

      // Store success data
      setSuccessReservation({
        court: selectedCourtData?.name || 'Cancha',
        date: format(selectedDate, "EEEE d 'de' MMMM", { locale: es }),
        time: selectedSlot.start_time,
        duration: selectedSlot.duration_minutes,
        price: price,
      });

      setSelectedSlot(null);
      setShowSuccessModal(true);
      loadAvailableSlots();
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      alert('Error al crear la reserva: ' + error.message);
    } finally {
      setReserving(false);
    }
  };

  const selectedCourtData = courts.find((c) => c.id === selectedCourt);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Court Selection */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
        <h2 className="font-heading text-[20px] sm:text-[24px] text-white mb-3 sm:mb-4">ELEGÍ TU CANCHA</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourt(court.id)}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                selectedCourt === court.id
                  ? 'border-[#dbf228] bg-[#dbf228]/10'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <div className="font-heading text-[14px] sm:text-[16px] text-white mb-1 sm:mb-2">{court.name}</div>
              <div className="font-body text-[11px] sm:text-[12px] text-gray-400">{court.type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-heading text-[20px] sm:text-[24px] text-white">ELEGÍ TU FECHA</h2>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
            title="Ver calendario"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {/* Month Calendar - Desplegable */}
        {showCalendar && (
          <div className="mb-4 bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = addDays(selectedDate, -30);
                  setSelectedDate(newDate);
                }}
                className="px-3 py-1 bg-white/10 text-white font-body text-[12px] rounded hover:bg-white/20 transition-colors"
              >
                ← Mes ant.
              </button>
              <div className="font-heading text-[16px] text-white capitalize">
                {format(selectedDate, 'MMMM yyyy', { locale: es })}
              </div>
              <button
                onClick={() => {
                  const newDate = addDays(selectedDate, 30);
                  setSelectedDate(newDate);
                }}
                className="px-3 py-1 bg-white/10 text-white font-body text-[12px] rounded hover:bg-white/20 transition-colors"
              >
                Mes sig. →
              </button>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center font-body text-[10px] text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 }),
                end: endOfMonth(selectedDate),
              }).map((day) => {
                const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      if (!isPast && isCurrentMonth) {
                        setSelectedDate(day);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={isPast || !isCurrentMonth}
                    className={`p-2 rounded text-[12px] transition-all ${
                      isPast || !isCurrentMonth
                        ? 'text-gray-600 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#dbf228] text-[#1b1b1b] font-bold'
                          : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => {
              const newDate = addDays(selectedDate, -7);
              if (!isBefore(startOfDay(newDate), startOfDay(new Date()))) {
                setSelectedDate(newDate);
              }
            }}
            disabled={isBefore(startOfDay(addDays(selectedDate, -7)), startOfDay(new Date()))}
            className="px-2 sm:px-3 md:px-4 py-2 bg-white/10 text-white font-body text-[12px] sm:text-[13px] md:text-[14px] rounded hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span className="hidden sm:inline">← Semana anterior</span>
            <span className="sm:hidden">← Ant.</span>
          </button>
          <div className="font-heading text-[14px] sm:text-[16px] md:text-[18px] text-white text-center capitalize">
            {format(weekStart, 'MMMM yyyy', { locale: es })}
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="px-2 sm:px-3 md:px-4 py-2 bg-white/10 text-white font-body text-[12px] sm:text-[13px] md:text-[14px] rounded hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Semana siguiente →</span>
            <span className="sm:hidden">Sig. →</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDates.map((date) => {
            const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && setSelectedDate(date)}
                disabled={isPast}
                className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                  isPast
                    ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                    : isSelected
                      ? 'border-[#dbf228] bg-[#dbf228]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="font-body text-[10px] sm:text-[11px] md:text-[12px] text-gray-400 mb-0.5 sm:mb-1">
                  {format(date, 'EEE', { locale: es })}
                </div>
                <div className="font-heading text-[16px] sm:text-[18px] md:text-[20px] text-white">{format(date, 'd')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Slots */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6">
        <h2 className="font-heading text-[20px] sm:text-[24px] text-white mb-3 sm:mb-4">HORARIOS DISPONIBLES</h2>
        <div className="font-body text-[12px] sm:text-[14px] text-gray-400 mb-4 capitalize">
          {selectedCourtData?.name} - {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </div>

        {!userId && (
          <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="font-body text-[12px] sm:text-[14px] text-[#dbf228]">
              💡 Para realizar una reserva necesitás{' '}
              <a href="/auth/login?redirect=/reservas" className="underline font-bold">
                iniciar sesión
              </a>
              {' '}o{' '}
              <a href="/auth/signup?redirect=/reservas" className="underline font-bold">
                crear una cuenta
              </a>
            </p>
          </div>
        )}

        {loading ? (
          <LoadingSpinner size="md" text="Cargando horarios..." />
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="font-body text-[14px] sm:text-[16px] text-gray-400">
              No hay horarios configurados para este día
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {availableSlots.map((slot) => (
              <button
                key={slot.timeslot.id}
                onClick={() => slot.isAvailable && handleReserve(slot)}
                disabled={!slot.isAvailable}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                  slot.isBlocked
                    ? 'border-red-500/30 bg-red-500/10 cursor-not-allowed'
                    : slot.isAvailable
                      ? 'border-green-500/30 bg-green-500/10 hover:border-green-500/60 cursor-pointer'
                      : 'border-gray-500/30 bg-gray-500/10 cursor-not-allowed'
                }`}
              >
                <div className="font-heading text-[16px] sm:text-[18px] text-white mb-1">
                  {slot.timeslot.start_time}
                </div>
                <div className="font-body text-[11px] sm:text-[12px] text-gray-400 mb-2">
                  {slot.timeslot.duration_minutes} min
                </div>
                {slot.isBlocked ? (
                  <div className="font-body text-[11px] sm:text-[12px] text-red-400">
                    {slot.isPastTime ? 'Ya pasó' : 'Bloqueado'}
                  </div>
                ) : slot.isAvailable ? (
                  <div className="font-heading text-[14px] sm:text-[16px] text-[#dbf228]">${slot.price}</div>
                ) : (
                  <div className="font-body text-[11px] sm:text-[12px] text-gray-400">
                    Ocupado ({slot.existingReservationsCount}/
                    {slot.timeslot.max_concurrent_bookings})
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] border-2 border-[#dbf228] rounded-lg p-6 sm:p-8 max-w-md w-full">
            <h3 className="font-heading text-[24px] sm:text-[32px] text-white mb-6">
              CONFIRMAR RESERVA
            </h3>

            <div className="space-y-4 mb-8">
              <div>
                <p className="font-body text-[12px] text-gray-400">Cancha</p>
                <p className="font-body text-[16px] text-white">{selectedCourtData?.name}</p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400">Fecha</p>
                <p className="font-body text-[16px] text-white">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400">Horario</p>
                <p className="font-body text-[16px] text-white">
                  {selectedSlot.start_time} ({selectedSlot.duration_minutes} minutos)
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400">Precio</p>
                <p className="font-heading text-[24px] text-[#dbf228]">
                  $
                  {availableSlots.find((s) => s.timeslot.id === selectedSlot.id)?.price || 1000}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={confirmReservation}
                disabled={reserving}
                className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] sm:text-[18px] py-3 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reserving && <ButtonSpinner />}
                {reserving ? 'RESERVANDO...' : 'CONFIRMAR'}
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                disabled={reserving}
                className="flex-1 bg-white/10 text-white font-heading text-[16px] sm:text-[18px] py-3 rounded-md hover:bg-white/20 transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successReservation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] border-2 border-[#dbf228] rounded-lg p-6 sm:p-8 max-w-md w-full">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#dbf228]/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-[#dbf228]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h3 className="font-heading text-[24px] sm:text-[32px] text-white text-center mb-4">
              ¡RESERVA CONFIRMADA!
            </h3>

            <p className="font-body text-[14px] sm:text-[16px] text-gray-300 text-center mb-8">
              Tu reserva ha sido creada exitosamente
            </p>

            {/* Reservation Details */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 mb-8 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-body text-[12px] sm:text-[14px] text-gray-400">Cancha</span>
                <span className="font-body text-[14px] sm:text-[16px] text-white text-right">
                  {successReservation.court}
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex justify-between items-start">
                <span className="font-body text-[12px] sm:text-[14px] text-gray-400">Fecha</span>
                <span className="font-body text-[14px] sm:text-[16px] text-white text-right">
                  {successReservation.date}
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex justify-between items-start">
                <span className="font-body text-[12px] sm:text-[14px] text-gray-400">Horario</span>
                <span className="font-body text-[14px] sm:text-[16px] text-white">
                  {successReservation.time} ({successReservation.duration} min)
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex justify-between items-center">
                <span className="font-body text-[12px] sm:text-[14px] text-gray-400">Precio</span>
                <span className="font-heading text-[20px] sm:text-[24px] text-[#dbf228]">
                  ${successReservation.price}
                </span>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-[#dbf228]/10 border border-[#dbf228]/30 rounded-lg p-3 sm:p-4 mb-6">
              <p className="font-body text-[12px] sm:text-[14px] text-[#dbf228] text-center">
                💡 El pago se realiza en el lugar
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessReservation(null);
                }}
                className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] sm:text-[18px] py-3 rounded-md hover:bg-[#c5db23] transition-colors"
              >
                ENTENDIDO
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessReservation(null);
                  router.push('/mis-reservas');
                }}
                className="flex-1 bg-white/10 text-white font-heading text-[16px] sm:text-[18px] py-3 rounded-md hover:bg-white/20 transition-colors"
              >
                VER MIS RESERVAS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
