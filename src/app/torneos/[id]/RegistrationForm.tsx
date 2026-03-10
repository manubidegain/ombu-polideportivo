'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string | null;
  max_teams: number;
  min_teams: number | null;
  registrations_count?: number;
}

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  courts: { name: string } | null;
}

interface SubSlot {
  parentId: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  court_name: string | null;
  displayKey: string; // unique key for this sub-slot
}

interface RegistrationFormProps {
  tournamentId: string;
  categories: Category[];
  sportType: 'padel' | 'futbol';
  timeSlots: TimeSlot[];
  matchDurationMinutes?: number; // Duration of each match
}

export function RegistrationForm({
  tournamentId,
  categories,
  sportType,
  timeSlots,
  matchDurationMinutes = 60, // Default 60 minutes
}: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [currentStep, setCurrentStep] = useState<'team' | 'availability' | 'review'>('team');

  // Form state
  const [teamName, setTeamName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]); // Now stores displayKeys
  const [subSlots, setSubSlots] = useState<SubSlot[]>([]);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Function to split time slots into smaller sub-slots
  const generateSubSlots = (slots: TimeSlot[], duration: number): SubSlot[] => {
    const result: SubSlot[] = [];

    slots.forEach((slot) => {
      // Parse start and end times
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Generate sub-slots
      for (let time = startMinutes; time < endMinutes; time += duration) {
        const subStartHour = Math.floor(time / 60);
        const subStartMin = time % 60;
        const subEndHour = Math.floor((time + duration) / 60);
        const subEndMin = (time + duration) % 60;

        // Don't create sub-slot that goes beyond the original slot
        if (time + duration > endMinutes) break;

        const subStart = `${String(subStartHour).padStart(2, '0')}:${String(subStartMin).padStart(2, '0')}`;
        const subEnd = `${String(subEndHour).padStart(2, '0')}:${String(subEndMin).padStart(2, '0')}`;

        result.push({
          parentId: slot.id,
          day_of_week: slot.day_of_week,
          start_time: subStart,
          end_time: subEnd,
          court_name: slot.courts?.name || null,
          displayKey: `${slot.id}-${subStart}`,
        });
      }
    });

    return result;
  };

  // Generate sub-slots when timeSlots or matchDuration changes
  useEffect(() => {
    const generated = generateSubSlots(timeSlots, matchDurationMinutes);
    setSubSlots(generated);
  }, [timeSlots, matchDurationMinutes]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setUserEmail(user.email || '');
      }
    };
    checkAuth();
  }, []);

  const handleToggleSlot = (slotId: string) => {
    setUnavailableSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!teamName.trim()) {
      toast.error('El nombre del equipo es requerido');
      return;
    }

    if (!categoryId) {
      toast.error('Debe seleccionar una categoría');
      return;
    }

    if (!partnerEmail.trim()) {
      toast.error('El email del compañero es requerido');
      return;
    }

    if (partnerEmail.toLowerCase() === userEmail.toLowerCase()) {
      toast.error('No puedes invitarte a ti mismo');
      return;
    }

    // Check if category is full
    const selectedCategory = categories.find((c) => c.id === categoryId);
    if (
      selectedCategory &&
      (selectedCategory.registrations_count || 0) >= selectedCategory.max_teams
    ) {
      toast.error('Esta categoría ya está llena');
      return;
    }

    // Warn if too many unavailable slots
    if (unavailableSlots.length >= subSlots.length) {
      toast.error('No puedes marcar todos los horarios como no disponibles');
      return;
    }

    if (unavailableSlots.length > subSlots.length * 0.7) {
      const confirmed = confirm(
        `Has marcado ${unavailableSlots.length} de ${subSlots.length} bloques como no disponibles. Esto puede dificultar la programación de partidos. ¿Deseas continuar?`
      );
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Map displayKeys back to parent time slot IDs
      // Get unique parent IDs from selected sub-slots
      const unavailableParentSlots = Array.from(
        new Set(
          unavailableSlots.map((displayKey) => {
            const subSlot = subSlots.find((s) => s.displayKey === displayKey);
            return subSlot?.parentId;
          }).filter(Boolean)
        )
      ) as string[];

      // Create invitation
      const { error } = await supabase.from('tournament_invitations').insert({
        tournament_id: tournamentId,
        category_id: categoryId,
        team_name: teamName,
        inviter_id: user.id,
        inviter_email: userEmail,
        invitee_email: partnerEmail,
        contact_phone: contactPhone || null,
        unavailable_slot_ids: unavailableParentSlots.length > 0 ? unavailableParentSlots : null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(
        `¡Invitación enviada! ${partnerEmail} recibirá un email para aceptar la inscripción.`
      );

      // Reset form
      setTeamName('');
      setPartnerEmail('');
      setContactPhone('');
      setUnavailableSlots([]);
      setCurrentStep('team');

      // Refresh page to update counts
      router.refresh();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Error al enviar la invitación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="font-body text-[14px] text-gray-700">
          Debes iniciar sesión para inscribirte al torneo
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-[#1b1b1b] text-white font-body text-[14px] py-2 px-6 rounded hover:bg-[#2b2b2b] transition-colors"
        >
          INICIAR SESIÓN
        </Link>
        <p className="font-body text-[12px] text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-[#1b1b1b] underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 h-2 rounded ${currentStep === 'team' ? 'bg-[#1b1b1b]' : 'bg-gray-300'}`}
        />
        <div
          className={`flex-1 h-2 rounded ${currentStep === 'availability' ? 'bg-[#1b1b1b]' : currentStep === 'review' ? 'bg-[#1b1b1b]' : 'bg-gray-300'}`}
        />
        <div
          className={`flex-1 h-2 rounded ${currentStep === 'review' ? 'bg-[#1b1b1b]' : 'bg-gray-300'}`}
        />
      </div>

      {/* Step 1: Team Info */}
      {currentStep === 'team' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentStep('availability');
          }}
          className="space-y-4"
        >
          <h3 className="font-heading text-[20px] text-[#1b1b1b]">EQUIPO</h3>

          {/* Category Selection */}
          <div>
            <label className="block font-body text-[14px] text-gray-700 mb-2">Categoría *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md font-body text-[14px] text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-[#1b1b1b]"
            >
              {categories.map((category) => {
                const isFull = (category.registrations_count || 0) >= category.max_teams;
                return (
                  <option key={category.id} value={category.id} disabled={isFull}>
                    {category.name}{' '}
                    {isFull
                      ? '(LLENO)'
                      : `(${category.registrations_count || 0}/${category.max_teams})`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Team Name */}
          <div>
            <label className="block font-body text-[14px] text-gray-700 mb-2">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ej: Los Cracks"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md font-body text-[14px] text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-[#1b1b1b]"
            />
          </div>

          {/* Your Email (readonly) */}
          <div>
            <label className="block font-body text-[14px] text-gray-700 mb-2">Tu Email</label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md font-body text-[14px] text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Partner Email */}
          <div>
            <label className="block font-body text-[14px] text-gray-700 mb-2">
              Email del Compañero *
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="compañero@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md font-body text-[14px] text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-[#1b1b1b]"
            />
            <p className="text-[12px] text-gray-600 mt-1">
              Tu compañero recibirá un email para aceptar la invitación
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block font-body text-[14px] text-gray-700 mb-2">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="099 123 456"
              className="w-full px-4 py-2 border border-gray-300 rounded-md font-body text-[14px] text-[#1b1b1b] focus:outline-none focus:ring-2 focus:ring-[#1b1b1b]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#2b2b2b] transition-colors"
          >
            SIGUIENTE
          </button>
        </form>
      )}

      {/* Step 2: Availability */}
      {currentStep === 'availability' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-heading text-[20px] text-[#1b1b1b] mb-2">DISPONIBILIDAD</h3>
            <p className="font-body text-[14px] text-gray-600 mb-2">
              Marca los bloques de {matchDurationMinutes} minutos donde <strong>NO</strong> puedes jugar
            </p>
            <p className="font-body text-[12px] text-gray-500 mb-4">
              ⚠️ Marca solo impedimentos reales (trabajo, viajes, compromisos ineludibles), no preferencias personales
            </p>
          </div>

          {subSlots.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {/* Group by day */}
              {Array.from(new Set(subSlots.map((s) => s.day_of_week)))
                .sort()
                .map((dayOfWeek) => {
                  const daySlots = subSlots.filter((s) => s.day_of_week === dayOfWeek);
                  return (
                    <div key={dayOfWeek} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="font-heading text-[16px] text-[#1b1b1b] mb-3">
                        {dayNames[dayOfWeek]}
                      </h4>
                      <div className="space-y-2">
                        {daySlots.map((subSlot) => (
                          <label
                            key={subSlot.displayKey}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={unavailableSlots.includes(subSlot.displayKey)}
                              onChange={() => handleToggleSlot(subSlot.displayKey)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <p className="font-body text-[14px] text-[#1b1b1b]">
                                {subSlot.start_time} - {subSlot.end_time}
                              </p>
                              {subSlot.court_name && (
                                <p className="font-body text-[11px] text-gray-500">
                                  {subSlot.court_name}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-4">
              No hay horarios configurados para este torneo
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('team')}
              className="flex-1 bg-white border border-gray-300 text-[#1b1b1b] font-body text-[16px] py-3 px-6 rounded-md hover:bg-gray-50 transition-colors"
            >
              ATRÁS
            </button>
            <button
              onClick={() => setCurrentStep('review')}
              className="flex-1 bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#2b2b2b] transition-colors"
            >
              SIGUIENTE
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && (
        <div className="space-y-4">
          <h3 className="font-heading text-[20px] text-[#1b1b1b]">REVISAR INSCRIPCIÓN</h3>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="font-body text-[12px] text-gray-600">Equipo</p>
              <p className="font-body text-[14px] text-[#1b1b1b] font-semibold">{teamName}</p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-600">Categoría</p>
              <p className="font-body text-[14px] text-[#1b1b1b]">
                {categories.find((c) => c.id === categoryId)?.name}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-600">Jugadores</p>
              <p className="font-body text-[14px] text-[#1b1b1b]">{userEmail}</p>
              <p className="font-body text-[14px] text-[#1b1b1b]">{partnerEmail}</p>
            </div>

            {contactPhone && (
              <div>
                <p className="font-body text-[12px] text-gray-600">Teléfono</p>
                <p className="font-body text-[14px] text-[#1b1b1b]">{contactPhone}</p>
              </div>
            )}

            <div>
              <p className="font-body text-[12px] text-gray-600">Horarios NO disponibles</p>
              <p className="font-body text-[14px] text-[#1b1b1b]">
                {unavailableSlots.length === 0
                  ? 'Disponible en todos los horarios'
                  : `${unavailableSlots.length} de ${subSlots.length} bloques marcados`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep('availability')}
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 text-[#1b1b1b] font-body text-[16px] py-3 px-6 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ATRÁS
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#1b1b1b] text-white font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#2b2b2b] transition-colors disabled:opacity-50"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR INVITACIÓN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
