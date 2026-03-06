'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Court = Tables<'courts'>;

interface CourtFormProps {
  court?: Court;
}

export function CourtForm({ court }: CourtFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: court?.name || '',
    type: court?.type || 'padel_cerrada',
    is_covered: court?.is_covered ?? true,
    has_lighting: court?.has_lighting ?? true,
    status: court?.status || 'active',
    capacity: court?.capacity || 1,
    description: court?.description || '',
    image_url: court?.image_url || '',
    calendar_id: court?.calendar_id || '',
    calendar_sync_enabled: court?.calendar_sync_enabled ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (court) {
        // Update existing court
        const { error: updateError } = await supabase
          .from('courts')
          .update(formData)
          .eq('id', court.id);

        if (updateError) throw updateError;
      } else {
        // Create new court
        const { error: insertError } = await supabase
          .from('courts')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      router.push('/admin/courts');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving court:', err);
      setError(err.message || 'Error al guardar la cancha');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-body text-[14px] text-white mb-2">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            placeholder="ej: Pádel Cerrada 1"
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block font-body text-[14px] text-white mb-2">
            Tipo <span className="text-red-400">*</span>
          </label>
          <select
            id="type"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="padel_cerrada">Pádel Cerrada</option>
            <option value="padel_abierta">Pádel Abierta</option>
            <option value="futbol_5">Fútbol 5</option>
            <option value="futbol_7">Fútbol 7</option>
          </select>
        </div>

        {/* Is Covered */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_covered}
              onChange={(e) => setFormData({ ...formData, is_covered: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Cancha techada
            </span>
          </label>
        </div>

        {/* Has Lighting */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_lighting}
              onChange={(e) => setFormData({ ...formData, has_lighting: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Tiene iluminación
            </span>
          </label>
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
            <option value="maintenance">Mantenimiento</option>
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block font-body text-[14px] text-white mb-2">
            Capacidad (reservas simultáneas) <span className="text-red-400">*</span>
          </label>
          <input
            id="capacity"
            type="number"
            required
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          />
          <p className="mt-2 font-body text-[12px] text-gray-400">
            Número de reservas que se pueden hacer al mismo tiempo en esta cancha
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block font-body text-[14px] text-white mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            placeholder="Descripción opcional de la cancha"
          />
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="image_url" className="block font-body text-[14px] text-white mb-2">
            URL de Imagen
          </label>
          <input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading text-[20px] text-white mb-2">
              INTEGRACIÓN GOOGLE CALENDAR
            </h3>
            <p className="font-body text-[14px] text-gray-400">
              Sincroniza automáticamente las reservas con Google Calendar
            </p>
          </div>
        </div>

        {/* Calendar Sync Enabled */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.calendar_sync_enabled}
              onChange={(e) => setFormData({ ...formData, calendar_sync_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228]"
            />
            <span className="font-body text-[14px] text-white">
              Activar sincronización con Google Calendar
            </span>
          </label>
        </div>

        {/* Calendar ID */}
        {formData.calendar_sync_enabled && (
          <div>
            <label htmlFor="calendar_id" className="block font-body text-[14px] text-white mb-2">
              Calendar ID
            </label>
            <input
              id="calendar_id"
              type="text"
              value={formData.calendar_id}
              onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              placeholder="ejemplo@group.calendar.google.com o 'primary'"
            />
            <p className="mt-2 font-body text-[12px] text-gray-400">
              El ID del calendario de Google donde se crearán los eventos. Podés usar "primary" para
              el calendario principal o el ID de un calendario específico (ej:
              abc123@group.calendar.google.com)
            </p>
          </div>
        )}

        {formData.calendar_sync_enabled && !formData.calendar_id && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
            <p className="font-body text-[12px] text-yellow-400">
              ⚠️ Necesitás configurar un Calendar ID para que la sincronización funcione
            </p>
          </div>
        )}
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
          {loading ? 'GUARDANDO...' : court ? 'ACTUALIZAR' : 'CREAR CANCHA'}
        </button>
        <Link
          href="/admin/courts"
          className="bg-white/10 text-white font-heading text-[18px] py-3 px-8 rounded-md hover:bg-white/20 transition-colors"
        >
          CANCELAR
        </Link>
      </div>
    </form>
  );
}
