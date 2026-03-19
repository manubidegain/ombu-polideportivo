'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type Unavailability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string | null;
};

type Props = {
  registrationId: string;
  teamName: string;
  onClose: () => void;
};

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function UnavailabilityManagerV2({ registrationId, teamName, onClose }: Props) {
  const [unavailability, setUnavailability] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadUnavailability();
  }, [registrationId]);

  async function loadUnavailability() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/tournament-registration/unavailability?registrationId=${registrationId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar restricciones');
      }

      setUnavailability(data.unavailability || []);
    } catch (error) {
      console.error('Error loading unavailability:', error);
      toast.error('Error al cargar restricciones');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!startTime || !endTime) {
      toast.error('Ingresá hora de inicio y fin');
      return;
    }

    if (startTime >= endTime) {
      toast.error('La hora de inicio debe ser menor a la hora de fin');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/admin/tournament-registration/unavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          dayOfWeek,
          startTime,
          endTime,
          reason: reason || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agregar restricción');
      }

      toast.success('Restricción agregada');
      setReason('');
      await loadUnavailability();
    } catch (error: any) {
      console.error('Error adding unavailability:', error);
      toast.error(error.message || 'Error al agregar restricción');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta restricción?')) return;

    setDeleting(id);
    try {
      const response = await fetch(
        `/api/admin/tournament-registration/unavailability?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar restricción');
      }

      toast.success('Restricción eliminada');
      await loadUnavailability();
    } catch (error) {
      console.error('Error deleting unavailability:', error);
      toast.error('Error al eliminar restricción');
    } finally {
      setDeleting(null);
    }
  }

  // Group by day
  const unavailabilityByDay = unavailability.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = [];
    }
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, Unavailability[]>);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-[13px] text-blue-300 mb-2">
                <strong>Instrucciones:</strong>
              </p>
              <ul className="font-body text-[12px] text-blue-300/80 space-y-1">
                <li>• Indicá los días y horarios en que esta pareja <strong>NO puede jugar</strong></li>
                <li>• Ejemplo: "Viernes de 8:00 a 11:00 (trabajo)"</li>
                <li>• El sistema evitará programar partidos en esos horarios</li>
              </ul>
            </div>
          </div>

          {/* Add Form */}
          <div className="bg-white/5 border border-white/10 rounded p-4 mb-6">
            <h3 className="font-heading text-[16px] text-white mb-4">
              AGREGAR RESTRICCIÓN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  DÍA *
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  DESDE *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
                />
              </div>

              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  HASTA *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                RAZÓN (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Trabajo, Clase, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-4 py-2 text-white font-body text-[14px] focus:outline-none focus:border-[#dbf228]"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <ButtonBallSpinner />
                  <span>AGREGANDO...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>AGREGAR</span>
                </>
              )}
            </button>
          </div>

          {/* Existing Restrictions */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ButtonBallSpinner />
            </div>
          ) : unavailability.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="font-body text-[14px] text-gray-400">
                No hay restricciones configuradas
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(unavailabilityByDay)
                .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                .map(([day, items]) => (
                  <div key={day}>
                    <h3 className="font-heading text-[16px] text-white mb-3">
                      {DAYS_OF_WEEK[Number(day)]}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="font-body text-[14px] text-white">
                                {item.start_time.substring(0, 5)} -{' '}
                                {item.end_time.substring(0, 5)}
                              </p>
                              {item.reason && (
                                <p className="font-body text-[12px] text-gray-400">
                                  {item.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-2 rounded bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Eliminar restricción"
                          >
                            {deleting === item.id ? (
                              <ButtonBallSpinner />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
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
