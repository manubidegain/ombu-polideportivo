'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type PricingRule = Tables<'pricing_rules'>;
type Court = Tables<'courts'>;
type Timeslot = Tables<'timeslot_configs'> & {
  courts: { name: string } | null;
};

interface PricingRuleFormProps {
  rule?: PricingRule;
  courts: Court[];
  timeslots: Timeslot[];
}

export function PricingRuleForm({ rule, courts, timeslots }: PricingRuleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    court_id: rule?.court_id || '',
    timeslot_config_id: rule?.timeslot_config_id || '',
    day_of_week: rule && rule.day_of_week !== null ? rule.day_of_week : '',
    duration_minutes: rule?.duration_minutes || '',
    start_date: rule?.start_date || '',
    end_date: rule?.end_date || '',
    price: rule?.price || 1000,
    is_promotion: rule?.is_promotion || false,
    promotion_name: rule?.promotion_name || '',
    priority: rule?.priority || 0,
    is_active: rule?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Prepare data - convert empty strings to null
    const dataToSave = {
      court_id: formData.court_id || null,
      timeslot_config_id: formData.timeslot_config_id || null,
      day_of_week: formData.day_of_week !== '' ? parseInt(formData.day_of_week as any) : null,
      duration_minutes: formData.duration_minutes !== '' ? parseInt(formData.duration_minutes as any) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      price: formData.price,
      is_promotion: formData.is_promotion,
      promotion_name: formData.is_promotion ? formData.promotion_name : null,
      priority: formData.priority,
      is_active: formData.is_active,
    };

    try {
      if (rule) {
        const { error: updateError } = await supabase
          .from('pricing_rules')
          .update(dataToSave)
          .eq('id', rule.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('pricing_rules')
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      router.push('/admin/pricing');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving pricing rule:', err);
      setError(err.message || 'Error al guardar la regla de precio');
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Court Selection */}
        <div>
          <label htmlFor="court_id" className="block font-body text-[14px] text-white mb-2">
            Cancha (opcional)
          </label>
          <select
            id="court_id"
            value={formData.court_id}
            onChange={(e) => setFormData({ ...formData, court_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Todas las canchas</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Si no seleccionas una cancha, la regla aplicará a todas
          </p>
        </div>

        {/* Timeslot Selection */}
        <div>
          <label htmlFor="timeslot_config_id" className="block font-body text-[14px] text-white mb-2">
            Horario específico (opcional)
          </label>
          <select
            id="timeslot_config_id"
            value={formData.timeslot_config_id}
            onChange={(e) => setFormData({ ...formData, timeslot_config_id: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Todos los horarios</option>
            {timeslots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.courts?.name} - {getDayName(slot.day_of_week)} {slot.start_time}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Selecciona un horario específico o déjalo en blanco
          </p>
        </div>

        {/* Day of Week Selection */}
        {!formData.timeslot_config_id && (
          <div>
            <label htmlFor="day_of_week" className="block font-body text-[14px] text-white mb-2">
              Día de la semana (opcional)
            </label>
            <select
              id="day_of_week"
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="">Todos los días</option>
              <option value="0">Domingo</option>
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
            </select>
            <p className="mt-2 font-body text-[12px] text-gray-400">
              Solo se muestra si no seleccionaste un horario específico
            </p>
          </div>
        )}

        {/* Duration Selection */}
        <div>
          <label htmlFor="duration_minutes" className="block font-body text-[14px] text-white mb-2">
            Duración (opcional)
          </label>
          <select
            id="duration_minutes"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="">Todas las duraciones</option>
            <option value="60">1 hora (60 minutos)</option>
            <option value="90">1 hora y media (90 minutos)</option>
          </select>
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Aplica el precio solo a reservas de esta duración
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block font-body text-[14px] text-white mb-2">
              Fecha de inicio (opcional)
            </label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block font-body text-[14px] text-white mb-2">
              Fecha de fin (opcional)
            </label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block font-body text-[14px] text-white mb-2">
            Precio <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-[16px] text-gray-400">
              $
            </span>
            <input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              placeholder="1000"
            />
          </div>
        </div>

        {/* Is Promotion */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_promotion}
              onChange={(e) => setFormData({ ...formData, is_promotion: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Es una promoción
            </span>
          </label>
        </div>

        {/* Promotion Name */}
        {formData.is_promotion && (
          <div>
            <label htmlFor="promotion_name" className="block font-body text-[14px] text-white mb-2">
              Nombre de la promoción
            </label>
            <input
              id="promotion_name"
              type="text"
              value={formData.promotion_name}
              onChange={(e) => setFormData({ ...formData, promotion_name: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              placeholder="ej: Descuento de verano"
            />
          </div>
        )}

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block font-body text-[14px] text-white mb-2">
            Prioridad <span className="text-red-400">*</span>
          </label>
          <input
            id="priority"
            type="number"
            required
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            placeholder="0"
          />
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Mayor prioridad se aplica primero. Usa 0 para reglas generales, números más altos para reglas específicas.
          </p>
        </div>

        {/* Is Active */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Regla activa
            </span>
          </label>
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
          {loading ? 'GUARDANDO...' : rule ? 'ACTUALIZAR' : 'CREAR REGLA'}
        </button>
        <Link
          href="/admin/pricing"
          className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
        >
          CANCELAR
        </Link>
      </div>
    </form>
  );
}
