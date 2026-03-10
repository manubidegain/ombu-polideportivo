'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | null;
  courts: { name: string } | null;
  court_id?: string;
}

interface TimeSlotManagerProps {
  tournamentId: string;
  timeSlots: TimeSlot[];
  courts: Tables<'courts'>[];
}

export function TimeSlotManager({ tournamentId, timeSlots, courts }: TimeSlotManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Form state
  const [formData, setFormData] = useState({
    court_id: courts[0]?.id || '',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '20:00',
  });

  const resetForm = () => {
    setFormData({
      court_id: courts[0]?.id || '',
      day_of_week: 1,
      start_time: '18:00',
      end_time: '20:00',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (slot: TimeSlot) => {
    setFormData({
      court_id: slot.court_id || courts[0]?.id || '',
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5),
    });
    setEditingId(slot.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.court_id) {
      toast.error('Debe seleccionar una cancha');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('El horario de inicio debe ser menor al de fin');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (editingId) {
        // Update existing time slot
        const { error } = await supabase
          .from('tournament_time_slots')
          .update({
            court_id: formData.court_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Horario actualizado');
      } else {
        // Create new time slot
        const { error } = await supabase.from('tournament_time_slots').insert({
          tournament_id: tournamentId,
          court_id: formData.court_id,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          is_active: true,
        });

        if (error) throw error;
        toast.success('Horario agregado');
      }

      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error saving time slot:', error);
      toast.error('Error al guardar el horario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('¿Eliminar este horario? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('tournament_time_slots').delete().eq('id', slotId);

      if (error) throw error;
      toast.success('Horario eliminado');
      router.refresh();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast.error('Error al eliminar el horario');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (slotId: string, currentStatus: boolean | null) => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tournament_time_slots')
        .update({ is_active: !currentStatus })
        .eq('id', slotId);

      if (error) throw error;
      toast.success(!currentStatus ? 'Horario activado' : 'Horario desactivado');
      router.refresh();
    } catch (error) {
      console.error('Error toggling time slot:', error);
      toast.error('Error al cambiar el estado del horario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-[24px] text-white">
          HORARIOS DISPONIBLES ({timeSlots.length})
        </h2>
        {!isAdding && !editingId && courts.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
          >
            + Agregar Horario
          </button>
        )}
      </div>

      {courts.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="font-body text-[14px] text-yellow-400">
            No hay canchas activas. Debes tener canchas creadas para definir horarios.
          </p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h3 className="font-heading text-[18px] text-white mb-4">
            {editingId ? 'EDITAR HORARIO' : 'NUEVO HORARIO'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">Cancha *</label>
              <select
                value={formData.court_id}
                onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} - {court.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Día de la Semana *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) =>
                  setFormData({ ...formData, day_of_week: parseInt(e.target.value) })
                }
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              >
                {dayNames.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>

              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  Hora Fin *
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <ButtonBallSpinner />}
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="bg-white/10 text-white font-body text-[14px] py-2 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Slots List */}
      {timeSlots.length > 0 ? (
        <div className="space-y-3">
          {timeSlots
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-body text-[14px] text-white">{dayNames[slot.day_of_week]}</p>
                    <p className="font-body text-[12px] text-gray-400">{slot.courts?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-body text-[14px] text-white">
                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                  </p>
                  {!slot.is_active && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded font-body text-[10px]">
                      INACTIVO
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(slot.id, slot.is_active)}
                      disabled={loading || isAdding || editingId !== null}
                      className="text-yellow-400 hover:text-yellow-300 font-body text-[12px] disabled:opacity-50"
                    >
                      {slot.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleEdit(slot)}
                      disabled={loading || isAdding || editingId !== null}
                      className="text-blue-400 hover:text-blue-300 font-body text-[12px] disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      disabled={loading || isAdding || editingId !== null}
                      className="text-red-400 hover:text-red-300 font-body text-[12px] disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="font-body text-[14px] text-gray-400">No hay horarios configurados</p>
      )}
    </div>
  );
}
