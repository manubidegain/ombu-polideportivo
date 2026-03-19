'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type TimeSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  court_id: string;
  courts: {
    name: string;
  };
};

type Unavailability = {
  id: string;
  time_slot_id: string;
  reason: string | null;
};

type Props = {
  registrationId: string;
  teamName: string;
  tournamentId: string;
  onClose: () => void;
};

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function UnavailabilityManager({ registrationId, teamName, tournamentId, onClose }: Props) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [unavailability, setUnavailability] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [registrationId, tournamentId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load time slots for this tournament
      const timeSlotsRes = await fetch(`/api/admin/tournaments/${tournamentId}/time-slots`);
      const timeSlotsData = await timeSlotsRes.json();

      // Load current unavailability
      const unavailabilityRes = await fetch(
        `/api/admin/tournament-registration/unavailability?registrationId=${registrationId}`
      );
      const unavailabilityData = await unavailabilityRes.json();

      setTimeSlots(timeSlotsData.timeSlots || []);
      setUnavailability(unavailabilityData.unavailability || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  }

  async function toggleUnavailability(timeSlotId: string) {
    const isCurrentlyUnavailable = unavailability.some((u) => u.time_slot_id === timeSlotId);
    const action = isCurrentlyUnavailable ? 'remove' : 'add';

    setProcessing(timeSlotId);
    try {
      const response = await fetch('/api/admin/tournament-registration/unavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          timeSlotId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      // Reload data
      await loadData();
      toast.success(
        isCurrentlyUnavailable ? 'Restricción eliminada' : 'Restricción agregada'
      );
    } catch (error) {
      console.error('Error toggling unavailability:', error);
      toast.error('Error al actualizar restricción');
    } finally {
      setProcessing(null);
    }
  }

  function isUnavailable(timeSlotId: string): boolean {
    return unavailability.some((u) => u.time_slot_id === timeSlotId);
  }

  // Group time slots by day
  const slotsByDay = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] border border-white/10 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[24px] text-white mb-1">
              RESTRICCIONES HORARIAS
            </h2>
            <p className="font-body text-[14px] text-gray-400">{teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ButtonBallSpinner />
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="font-body text-[14px] text-gray-400">
                No hay horarios configurados para este torneo
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
                <p className="font-body text-[12px] text-blue-400">
                  <strong>💡 Instrucciones:</strong> Marcá los horarios en los que esta pareja{' '}
                  <strong>NO puede jugar</strong>. Los horarios marcados serán evitados al
                  programar partidos.
                </p>
              </div>

              {Object.entries(slotsByDay)
                .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                .map(([day, slots]) => (
                  <div key={day}>
                    <h3 className="font-heading text-[16px] text-white mb-3">
                      {DAYS_OF_WEEK[Number(day)]}
                    </h3>
                    <div className="space-y-2">
                      {slots.map((slot) => {
                        const unavailable = isUnavailable(slot.id);
                        const isProcessing = processing === slot.id;

                        return (
                          <button
                            key={slot.id}
                            onClick={() => toggleUnavailability(slot.id)}
                            disabled={isProcessing}
                            className={`w-full text-left p-4 rounded border transition-all ${
                              unavailable
                                ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            } disabled:opacity-50`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="font-body text-[14px] text-white">
                                    {slot.start_time.substring(0, 5)} -{' '}
                                    {slot.end_time.substring(0, 5)}
                                  </p>
                                  <p className="font-body text-[12px] text-gray-400">
                                    {slot.courts.name}
                                  </p>
                                </div>
                              </div>
                              {isProcessing ? (
                                <ButtonBallSpinner />
                              ) : unavailable ? (
                                <span className="font-body text-[12px] text-red-400 px-3 py-1 rounded-full bg-red-500/20">
                                  NO DISPONIBLE
                                </span>
                              ) : (
                                <span className="font-body text-[12px] text-green-400 px-3 py-1 rounded-full bg-green-500/20">
                                  DISPONIBLE
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-white/10 text-white font-body text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
