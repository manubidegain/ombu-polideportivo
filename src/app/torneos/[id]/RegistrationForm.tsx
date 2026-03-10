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

interface RegistrationFormProps {
  tournamentId: string;
  categories: Category[];
  sportType: 'padel' | 'futbol';
  timeSlots: TimeSlot[];
}

export function RegistrationForm({
  tournamentId,
  categories,
  sportType,
  timeSlots,
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
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    if (unavailableSlots.length >= timeSlots.length) {
      toast.error('No puedes marcar todos los horarios como no disponibles');
      return;
    }

    if (unavailableSlots.length > timeSlots.length * 0.7) {
      const confirmed = confirm(
        `Has marcado ${unavailableSlots.length} de ${timeSlots.length} horarios como no disponibles. Esto puede dificultar la programación de partidos. ¿Deseas continuar?`
      );
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Create invitation
      const { error } = await supabase.from('tournament_invitations').insert({
        tournament_id: tournamentId,
        category_id: categoryId,
        team_name: teamName,
        inviter_id: user.id,
        inviter_email: userEmail,
        invitee_email: partnerEmail,
        contact_phone: contactPhone || null,
        unavailable_slot_ids: unavailableSlots.length > 0 ? unavailableSlots : null,
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
            <p className="font-body text-[14px] text-gray-600 mb-4">
              Marca los horarios donde <strong>NO</strong> puedes jugar
            </p>
          </div>

          {timeSlots.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {timeSlots.map((slot) => (
                <label
                  key={slot.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={unavailableSlots.includes(slot.id)}
                    onChange={() => handleToggleSlot(slot.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-body text-[14px] text-[#1b1b1b]">
                      {dayNames[slot.day_of_week]} {slot.start_time.substring(0, 5)} -{' '}
                      {slot.end_time.substring(0, 5)}
                    </p>
                    {slot.courts && (
                      <p className="font-body text-[12px] text-gray-600">{slot.courts.name}</p>
                    )}
                  </div>
                </label>
              ))}
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
                  : `${unavailableSlots.length} de ${timeSlots.length} horarios marcados`}
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
