'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/tournaments/achievement-definitions';
import { EditProfileForm } from './EditProfileForm';

type ProfileData = {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
  };
  stats: {
    totalTournaments: number;
    totalMatches: number;
    totalAchievements: number;
    wins: number;
    winRate: number;
  };
  registrations: any[];
  matches: any[];
  achievements: any[];
  reservations: any[];
};

type TabType = 'overview' | 'torneos' | 'logros' | 'reservas' | 'configuracion';

export function ProfileTabs({ data }: { data: ProfileData }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Resumen' },
    { id: 'torneos', label: 'Torneos', count: data.stats.totalTournaments },
    { id: 'logros', label: 'Logros', count: data.stats.totalAchievements },
    { id: 'reservas', label: 'Reservas', count: data.reservations.length },
    { id: 'configuracion', label: 'Configuración' },
  ];

  return (
    <>
      {/* Tabs Navigation */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-2 mb-8">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-3 rounded font-heading text-[14px] transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#dbf228] text-[#1b1b1b]'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-[12px] opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'torneos' && <TorneosTab data={data} />}
        {activeTab === 'logros' && <LogrosTab data={data} />}
        {activeTab === 'reservas' && <ReservasTab data={data} />}
        {activeTab === 'configuracion' && <ConfiguracionTab data={data} />}
      </div>
    </>
  );
}

function OverviewTab({ data }: { data: ProfileData }) {
  // Get recent achievements (last 3)
  const recentAchievements = data.achievements.slice(0, 3);

  // Get upcoming matches
  const upcomingMatches = data.matches
    .filter((m) => m.status === 'scheduled' || m.status === 'pending')
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div>
        <h2 className="font-heading text-[24px] text-white mb-4">ESTADÍSTICAS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="font-heading text-[32px] text-[#dbf228]">{data.stats.totalTournaments}</p>
            <p className="font-body text-[12px] text-gray-400">Torneos</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="font-heading text-[32px] text-[#dbf228]">{data.stats.totalMatches}</p>
            <p className="font-body text-[12px] text-gray-400">Partidos</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="font-heading text-[32px] text-[#dbf228]">{data.stats.wins}</p>
            <p className="font-body text-[12px] text-gray-400">Victorias</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="font-heading text-[32px] text-[#dbf228]">{data.stats.winRate}%</p>
            <p className="font-body text-[12px] text-gray-400">Efectividad</p>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-[24px] text-white">LOGROS RECIENTES</h2>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // This would be handled by parent component to switch tabs
            }}
            className="font-body text-[14px] text-[#dbf228] hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {recentAchievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(() => {
              const achievementsByType = recentAchievements.reduce(
                (acc: any, achievement: any) => {
                  const type = achievement.achievement_type;
                  if (!acc[type]) {
                    acc[type] = [];
                  }
                  acc[type].push(achievement);
                  return acc;
                },
                {}
              );

              return Object.entries(achievementsByType).map(([type, items]: [string, any]) => {
                const definition = ACHIEVEMENT_DEFINITIONS[type as keyof typeof ACHIEVEMENT_DEFINITIONS];
                if (!definition) return null;

                return (
                  <div
                    key={type}
                    className="relative group"
                    title={`${definition.name} x${items.length}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23] flex items-center justify-center text-[24px] shadow-md">
                      {definition.emoji}
                    </div>
                    {items.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-[#1b1b1b] text-white text-[10px] font-heading rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                        {items.length}
                      </span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">
            Todavía no has ganado logros. ¡Sigue jugando!
          </p>
        )}
      </div>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h2 className="font-heading text-[24px] text-white mb-4">PRÓXIMOS PARTIDOS</h2>
          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#dbf228]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-[16px] text-white mb-1">
                      {match.team1?.team_name || 'Equipo 1'} vs{' '}
                      {match.team2?.team_name || 'Equipo 2'}
                    </p>
                    <p className="font-body text-[12px] text-gray-400">
                      {match.tournament?.name}
                    </p>
                  </div>
                  {match.scheduled_date && (
                    <div className="text-right">
                      <p className="font-body text-[14px] text-white">
                        {format(new Date(match.scheduled_date), 'd MMM', { locale: es })}
                      </p>
                      {match.scheduled_time && (
                        <p className="font-body text-[12px] text-gray-400">
                          {match.scheduled_time.slice(0, 5)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TorneosTab({ data }: { data: ProfileData }) {
  // Group registrations by tournament
  const tournamentGroups = data.registrations.reduce(
    (acc, reg) => {
      if (!reg.category?.tournament) return acc;
      const tournamentId = reg.category.tournament.id;
      if (!acc[tournamentId]) {
        acc[tournamentId] = {
          tournament: reg.category.tournament,
          registrations: [],
        };
      }
      acc[tournamentId].registrations.push(reg);
      return acc;
    },
    {} as Record<string, any>
  );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-[24px] text-white mb-4">MIS TORNEOS</h2>

      {Object.values(tournamentGroups).length === 0 ? (
        <div className="text-center py-8">
          <p className="font-body text-[16px] text-gray-400 mb-4">
            No estás inscrito en ningún torneo todavía.
          </p>
          <Link
            href="/torneos"
            className="inline-block bg-[#dbf228] text-[#1b1b1b] px-6 py-3 rounded font-heading text-[14px] hover:bg-[#c5db23] transition-colors"
          >
            EXPLORAR TORNEOS
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(tournamentGroups).map((group: any) => (
            <div
              key={group.tournament.id}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-[20px] text-white mb-2">
                    {group.tournament.name}
                  </h3>
                  <div className="flex gap-4 text-[12px] text-gray-400">
                    <span>
                      {format(new Date(group.tournament.start_date), 'd MMM yyyy', {
                        locale: es,
                      })}
                    </span>
                    <span className="capitalize">{group.tournament.sport_type}</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        group.tournament.status === 'completed'
                          ? 'bg-gray-500/20 text-gray-400'
                          : group.tournament.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {group.tournament.status === 'completed'
                        ? 'Finalizado'
                        : group.tournament.status === 'in_progress'
                          ? 'En Curso'
                          : 'Próximo'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/torneos/${group.tournament.id}`}
                  className="px-4 py-2 bg-[#dbf228] text-[#1b1b1b] rounded font-body text-[12px] hover:bg-[#c5db23] transition-colors"
                >
                  Ver Torneo
                </Link>
              </div>

              {/* Registrations for this tournament */}
              <div className="space-y-2">
                {group.registrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className="bg-white/5 border border-white/10 rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-body text-[14px] text-white">
                        Categoría: {reg.category?.name}
                      </p>
                      <p className="font-body text-[12px] text-gray-400">
                        Estado:{' '}
                        <span
                          className={
                            reg.status === 'confirmed'
                              ? 'text-green-400'
                              : reg.status === 'pending'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                          }
                        >
                          {reg.status === 'confirmed'
                            ? 'Confirmado'
                            : reg.status === 'pending'
                              ? 'Pendiente'
                              : reg.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogrosTab({ data }: { data: ProfileData }) {
  const totalAchievements = data.achievements.length;
  const uniqueTypes = new Set(data.achievements.map((a) => a.achievement_type)).size;
  const championCount = data.achievements.filter((a) => a.achievement_type === 'champion').length;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-[24px] text-white mb-4">MIS LOGROS</h2>

      {data.achievements.length > 0 ? (
        <>
          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-heading text-[32px] text-[#dbf228]">{totalAchievements}</p>
              <p className="font-body text-[12px] text-gray-400">Total Logros</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-heading text-[32px] text-[#dbf228]">{uniqueTypes}</p>
              <p className="font-body text-[12px] text-gray-400">Tipos Únicos</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-heading text-[32px] text-[#dbf228]">{championCount}</p>
              <p className="font-body text-[12px] text-gray-400">Campeonatos</p>
            </div>
          </div>

          {/* Achievement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.achievements.map((achievement) => {
              const definition =
                ACHIEVEMENT_DEFINITIONS[achievement.achievement_type as keyof typeof ACHIEVEMENT_DEFINITIONS];

              if (!definition) return null;

              return (
                <div
                  key={achievement.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#dbf228]/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Icon */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23] flex items-center justify-center text-[32px] shadow-lg">
                      {definition.emoji}
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-[18px] text-white mb-1">
                        {definition.name}
                      </h3>
                      <p className="font-body text-[12px] text-gray-400 mb-2">
                        {definition.description}
                      </p>

                      {/* Tournament/Category */}
                      {achievement.tournament && (
                        <p className="font-body text-[11px] text-gray-500 mb-1">
                          {achievement.tournament.name}
                          {achievement.category && ` - ${achievement.category.name}`}
                        </p>
                      )}

                      {/* Date */}
                      {achievement.awarded_at && (
                        <p className="font-body text-[10px] text-gray-600">
                          {format(new Date(achievement.awarded_at), 'd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="font-body text-[16px] text-gray-400 mb-4">
            Todavía no has ganado logros. ¡Participa en torneos para ganar logros!
          </p>
          <Link
            href="/torneos"
            className="inline-block bg-[#dbf228] text-[#1b1b1b] px-6 py-3 rounded font-heading text-[14px] hover:bg-[#c5db23] transition-colors"
          >
            EXPLORAR TORNEOS
          </Link>
        </div>
      )}
    </div>
  );
}

function ReservasTab({ data }: { data: ProfileData }) {
  const upcomingReservations = data.reservations.filter(
    (r) => new Date(r.start_time) > new Date()
  );
  const pastReservations = data.reservations.filter(
    (r) => new Date(r.start_time) <= new Date()
  );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-[24px] text-white mb-4">MIS RESERVAS</h2>

      {data.reservations.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-body text-[16px] text-gray-400 mb-4">No tienes reservas todavía.</p>
          <Link
            href="/reservas"
            className="inline-block bg-[#dbf228] text-[#1b1b1b] px-6 py-3 rounded font-heading text-[14px] hover:bg-[#c5db23] transition-colors"
          >
            HACER RESERVA
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming Reservations */}
          {upcomingReservations.length > 0 && (
            <div>
              <h3 className="font-heading text-[18px] text-white mb-3">PRÓXIMAS RESERVAS</h3>
              <div className="space-y-3">
                {upcomingReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            </div>
          )}

          {/* Past Reservations */}
          {pastReservations.length > 0 && (
            <div>
              <h3 className="font-heading text-[18px] text-white mb-3">RESERVAS ANTERIORES</h3>
              <div className="space-y-3">
                {pastReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReservationCard({ reservation }: { reservation: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-[16px] text-white mb-1">
            {reservation.court?.name || 'Cancha'}
          </p>
          <p className="font-body text-[12px] text-gray-400 capitalize">
            {reservation.court?.sport_type}
          </p>
        </div>
        <div className="text-right">
          <p className="font-body text-[14px] text-white">
            {format(new Date(reservation.start_time), "d 'de' MMM yyyy", { locale: es })}
          </p>
          <p className="font-body text-[12px] text-gray-400">
            {format(new Date(reservation.start_time), 'HH:mm', { locale: es })} -{' '}
            {format(new Date(reservation.end_time), 'HH:mm', { locale: es })}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <span
          className={`inline-block px-2 py-1 rounded text-[10px] font-body ${
            reservation.status === 'confirmed'
              ? 'bg-green-500/20 text-green-400'
              : reservation.status === 'cancelled'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {reservation.status === 'confirmed'
            ? 'Confirmada'
            : reservation.status === 'cancelled'
              ? 'Cancelada'
              : 'Pendiente'}
        </span>
      </div>
    </div>
  );
}

function ConfiguracionTab({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-[24px] text-white mb-4">CONFIGURACIÓN</h2>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="font-heading text-[18px] text-white mb-4">INFORMACIÓN DEL PERFIL</h3>
          <EditProfileForm
            userId={data.user.id}
            initialName={data.user.name}
            initialAvatarUrl={data.user.avatar_url}
          />

          {/* Email (read-only) */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={data.user.email}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-gray-400 font-body text-[14px]"
            />
            <p className="font-body text-[10px] text-gray-500 mt-2">
              El correo electrónico no se puede cambiar
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="font-heading text-[18px] text-white mb-4">NOTIFICACIONES</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-[#dbf228]"
                defaultChecked
              />
              <span className="font-body text-[14px] text-white">
                Notificaciones de partidos programados
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-[#dbf228]"
                defaultChecked
              />
              <span className="font-body text-[14px] text-white">
                Notificaciones de torneos
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-[#dbf228]"
                defaultChecked
              />
              <span className="font-body text-[14px] text-white">
                Notificaciones de logros
              </span>
            </label>
          </div>
          <p className="font-body text-[12px] text-gray-500 mt-4">
            Las preferencias de notificación se guardan automáticamente.
          </p>
        </div>

        {/* Account Actions */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="font-heading text-[18px] text-white mb-4">ACCIONES DE CUENTA</h3>
          <div className="space-y-3">
            <Link
              href="/api/auth/logout"
              className="inline-block px-6 py-3 bg-red-500/20 text-red-400 rounded font-body text-[14px] hover:bg-red-500/30 transition-colors"
            >
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
