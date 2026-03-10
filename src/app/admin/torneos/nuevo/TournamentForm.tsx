'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import { toast } from 'sonner';
import Link from 'next/link';

interface TournamentFormProps {
  courts: Tables<'courts'>[];
}

type FormStep = 'basic' | 'categories' | 'schedule' | 'review';

interface Category {
  name: string;
  description: string;
  max_teams: number;
  min_teams: number;
}

interface TimeSlot {
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function TournamentForm({ courts }: TournamentFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [loading, setLoading] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sportType, setSportType] = useState<'padel' | 'futbol'>('padel');
  const [registrationPrice, setRegistrationPrice] = useState('0');
  const [setsToWin, setSetsToWin] = useState('2');
  const [gamesPerSet, setGamesPerSet] = useState('6');
  const [tiebreakPoints, setTiebreakPoints] = useState('7');
  const [matchDuration, setMatchDuration] = useState('90');
  const [startDate, setStartDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>([
    { name: 'Categoría A', description: '', max_teams: 16, min_teams: 4 },
  ]);

  // Time slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        name: `Categoría ${String.fromCharCode(65 + categories.length)}`,
        description: '',
        max_teams: 16,
        min_teams: 4,
      },
    ]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof Category, value: string | number) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleAddTimeSlot = () => {
    if (courts.length === 0) {
      toast.error('No hay canchas disponibles');
      return;
    }

    setTimeSlots([
      ...timeSlots,
      {
        court_id: courts[0].id,
        day_of_week: 1, // Monday
        start_time: '18:00',
        end_time: '20:00',
      },
    ]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleTimeSlotChange = (
    index: number,
    field: keyof TimeSlot,
    value: string | number
  ) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const validateBasicInfo = () => {
    if (!name.trim()) {
      toast.error('El nombre del torneo es requerido');
      return false;
    }
    if (!startDate) {
      toast.error('La fecha de inicio es requerida');
      return false;
    }
    if (parseFloat(registrationPrice) < 0) {
      toast.error('El precio no puede ser negativo');
      return false;
    }
    return true;
  };

  const validateCategories = () => {
    if (categories.length === 0) {
      toast.error('Debe haber al menos una categoría');
      return false;
    }

    for (const cat of categories) {
      if (!cat.name.trim()) {
        toast.error('Todas las categorías deben tener nombre');
        return false;
      }
      if (cat.max_teams < cat.min_teams) {
        toast.error(`${cat.name}: El máximo debe ser mayor o igual al mínimo`);
        return false;
      }
      if (cat.min_teams < 2) {
        toast.error(`${cat.name}: Debe haber al menos 2 equipos mínimos`);
        return false;
      }
    }

    return true;
  };

  const validateSchedule = () => {
    if (timeSlots.length === 0) {
      toast.error('Debe definir al menos un horario disponible');
      return false;
    }

    for (const slot of timeSlots) {
      if (slot.start_time >= slot.end_time) {
        toast.error('El horario de inicio debe ser menor al de fin');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 'basic' && validateBasicInfo()) {
      setCurrentStep('categories');
    } else if (currentStep === 'categories' && validateCategories()) {
      setCurrentStep('schedule');
    } else if (currentStep === 'schedule' && validateSchedule()) {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    const steps: FormStep[] = ['basic', 'categories', 'schedule', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateBasicInfo() || !validateCategories() || !validateSchedule()) {
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name,
          description,
          sport_type: sportType,
          registration_price: parseFloat(registrationPrice),
          sets_to_win: parseInt(setsToWin),
          games_per_set: parseInt(gamesPerSet),
          tiebreak_points: parseInt(tiebreakPoints),
          match_duration_minutes: parseInt(matchDuration),
          start_date: startDate,
          registration_deadline: registrationDeadline || null,
          status: 'draft',
        })
        .select()
        .single();

      if (tournamentError || !tournament) {
        throw tournamentError;
      }

      // Create categories
      const categoriesToInsert = categories.map((cat) => ({
        tournament_id: tournament.id,
        name: cat.name,
        description: cat.description,
        max_teams: cat.max_teams,
        min_teams: cat.min_teams,
      }));

      const { error: categoriesError } = await supabase
        .from('tournament_categories')
        .insert(categoriesToInsert);

      if (categoriesError) {
        throw categoriesError;
      }

      // Create time slots
      const timeSlotsToInsert = timeSlots.map((slot) => ({
        tournament_id: tournament.id,
        court_id: slot.court_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));

      const { error: slotsError } = await supabase
        .from('tournament_time_slots')
        .insert(timeSlotsToInsert);

      if (slotsError) {
        throw slotsError;
      }

      toast.success('Torneo creado exitosamente');
      router.push(`/admin/torneos/${tournament.id}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Error al crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <div
            className={`flex-1 h-2 rounded ${currentStep === 'basic' ? 'bg-[#dbf228]' : 'bg-white/20'}`}
          />
          <div
            className={`flex-1 h-2 rounded ${currentStep === 'categories' ? 'bg-[#dbf228]' : currentStep === 'schedule' || currentStep === 'review' ? 'bg-[#dbf228]' : 'bg-white/20'}`}
          />
          <div
            className={`flex-1 h-2 rounded ${currentStep === 'schedule' ? 'bg-[#dbf228]' : currentStep === 'review' ? 'bg-[#dbf228]' : 'bg-white/20'}`}
          />
          <div className={`flex-1 h-2 rounded ${currentStep === 'review' ? 'bg-[#dbf228]' : 'bg-white/20'}`} />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-8">
        {/* STEP 1: Basic Info */}
        {currentStep === 'basic' && (
          <div className="space-y-6">
            <h2 className="font-heading text-[32px] text-white mb-6">INFORMACIÓN BÁSICA</h2>

            <div>
              <label className="block font-body text-[14px] text-gray-400 mb-2">
                Nombre del Torneo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Torneo de Pádel Verano 2024"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>

            <div>
              <label className="block font-body text-[14px] text-gray-400 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del torneo..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-body text-[14px] text-gray-400 mb-2">Deporte *</label>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value as 'padel' | 'futbol')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                >
                  <option value="padel">Pádel</option>
                  <option value="futbol">Fútbol</option>
                </select>
              </div>

              <div>
                <label className="block font-body text-[14px] text-gray-400 mb-2">
                  Precio Inscripción ($) *
                </label>
                <input
                  type="number"
                  value={registrationPrice}
                  onChange={(e) => setRegistrationPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="font-heading text-[20px] text-white mb-4">CONFIGURACIÓN DE JUEGO</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Sets para Ganar *
                  </label>
                  <input
                    type="number"
                    value={setsToWin}
                    onChange={(e) => setSetsToWin(e.target.value)}
                    min="1"
                    max="5"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>

                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Games por Set *
                  </label>
                  <input
                    type="number"
                    value={gamesPerSet}
                    onChange={(e) => setGamesPerSet(e.target.value)}
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>

                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Puntos Tiebreak *
                  </label>
                  <input
                    type="number"
                    value={tiebreakPoints}
                    onChange={(e) => setTiebreakPoints(e.target.value)}
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>

                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Duración Partido (min) *
                  </label>
                  <input
                    type="number"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(e.target.value)}
                    min="30"
                    step="15"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="font-heading text-[20px] text-white mb-4">FECHAS</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>

                <div>
                  <label className="block font-body text-[14px] text-gray-400 mb-2">
                    Fin de Inscripciones
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md font-body text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Categories - Continued in next message due to length */}
        {currentStep === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-[32px] text-white">CATEGORÍAS</h2>
              <button
                onClick={handleAddCategory}
                className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
              >
                + Agregar Categoría
              </button>
            </div>

            <div className="space-y-4">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading text-[20px] text-white">
                      Categoría {index + 1}
                    </h3>
                    {categories.length > 1 && (
                      <button
                        onClick={() => handleRemoveCategory(index)}
                        className="text-red-400 hover:text-red-300 font-body text-[14px]"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-[12px] text-gray-400 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                        placeholder="Ej: Categoría A"
                        required
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-body text-[12px] text-gray-400 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={category.description}
                        onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                        placeholder="Ej: Nivel avanzado"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                      />
                    </div>

                    <div>
                      <label className="block font-body text-[12px] text-gray-400 mb-2">
                        Máximo Equipos *
                      </label>
                      <input
                        type="number"
                        value={category.max_teams}
                        onChange={(e) =>
                          handleCategoryChange(index, 'max_teams', parseInt(e.target.value))
                        }
                        min="2"
                        required
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                      />
                    </div>

                    <div>
                      <label className="block font-body text-[12px] text-gray-400 mb-2">
                        Mínimo Equipos *
                      </label>
                      <input
                        type="number"
                        value={category.min_teams}
                        onChange={(e) =>
                          handleCategoryChange(index, 'min_teams', parseInt(e.target.value))
                        }
                        min="2"
                        required
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Schedule */}
        {currentStep === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-[32px] text-white">HORARIOS DISPONIBLES</h2>
                <p className="font-body text-[14px] text-gray-400 mt-2">
                  Define los horarios en los que se pueden jugar los partidos del torneo
                </p>
              </div>
              <button
                onClick={handleAddTimeSlot}
                className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
              >
                + Agregar Horario
              </button>
            </div>

            {courts.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
                <p className="font-body text-[14px] text-yellow-400">
                  No hay canchas activas. Debes tener canchas creadas para definir horarios.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-heading text-[18px] text-white">
                        Horario {index + 1}
                      </h3>
                      <button
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="text-red-400 hover:text-red-300 font-body text-[14px]"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block font-body text-[12px] text-gray-400 mb-2">
                          Cancha *
                        </label>
                        <select
                          value={slot.court_id}
                          onChange={(e) =>
                            handleTimeSlotChange(index, 'court_id', e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                        >
                          {courts.map((court) => (
                            <option key={court.id} value={court.id}>
                              {court.name} - {court.type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block font-body text-[12px] text-gray-400 mb-2">
                          Día de la Semana *
                        </label>
                        <select
                          value={slot.day_of_week}
                          onChange={(e) =>
                            handleTimeSlotChange(index, 'day_of_week', parseInt(e.target.value))
                          }
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                        >
                          <option value={0}>Domingo</option>
                          <option value={1}>Lunes</option>
                          <option value={2}>Martes</option>
                          <option value={3}>Miércoles</option>
                          <option value={4}>Jueves</option>
                          <option value={5}>Viernes</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-body text-[12px] text-gray-400 mb-2">
                          Hora Inicio *
                        </label>
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            handleTimeSlotChange(index, 'start_time', e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                        />
                      </div>

                      <div>
                        <label className="block font-body text-[12px] text-gray-400 mb-2">
                          Hora Fin *
                        </label>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            handleTimeSlotChange(index, 'end_time', e.target.value)
                          }
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="font-heading text-[32px] text-white mb-6">REVISIÓN</h2>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-heading text-[20px] text-white mb-4">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <p className="text-gray-400">Nombre:</p>
                    <p className="text-white">{name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Deporte:</p>
                    <p className="text-white capitalize">{sportType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Precio:</p>
                    <p className="text-white">${registrationPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fecha Inicio:</p>
                    <p className="text-white">{startDate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-heading text-[20px] text-white mb-4">
                  Categorías ({categories.length})
                </h3>
                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <div key={i} className="text-[14px] text-white">
                      • {cat.name} - Máx: {cat.max_teams} equipos, Mín: {cat.min_teams} equipos
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-heading text-[20px] text-white mb-4">
                  Horarios Disponibles ({timeSlots.length})
                </h3>
                <div className="space-y-2">
                  {timeSlots.map((slot, i) => {
                    const court = courts.find((c) => c.id === slot.court_id);
                    return (
                      <div key={i} className="text-[14px] text-white">
                        • {getDayName(slot.day_of_week)} {slot.start_time} - {slot.end_time} en{' '}
                        {court?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/torneos"
          className="font-body text-[14px] text-gray-400 hover:text-white"
        >
          ← Cancelar
        </Link>

        <div className="flex gap-4">
          {currentStep !== 'basic' && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="bg-white/10 text-white font-body text-[16px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Atrás
            </button>
          )}

          {currentStep !== 'review' ? (
            <button
              onClick={handleNext}
              className="bg-[#dbf228] text-[#1b1b1b] font-body text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#dbf228] text-[#1b1b1b] font-body text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Torneo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
