import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  // Get stats
  const [courtsResult, reservationsResult, todayReservationsResult] = await Promise.all([
    supabase.from('courts').select('*', { count: 'exact' }),
    supabase.from('reservations').select('*', { count: 'exact' }).eq('status', 'confirmed'),
    supabase
      .from('reservations')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed')
      .eq('reservation_date', new Date().toISOString().split('T')[0]),
  ]);

  const stats = [
    {
      name: 'Canchas Activas',
      value: courtsResult.count || 0,
      link: '/admin/courts',
    },
    {
      name: 'Reservas Confirmadas',
      value: reservationsResult.count || 0,
      link: '/admin/reservations',
    },
    {
      name: 'Reservas Hoy',
      value: todayReservationsResult.count || 0,
      link: '/admin/reservations',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-heading text-[28px] sm:text-[40px] text-white">DASHBOARD</h1>
        <p className="font-body text-[14px] sm:text-[16px] text-gray-400 mt-2">
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.link}
            className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
          >
            <p className="font-body text-[14px] text-gray-400">{stat.name}</p>
            <p className="font-heading text-[48px] text-[#dbf228] mt-2">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-[20px] sm:text-[24px] text-white mb-4">ACCIONES RÁPIDAS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/admin/courts"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center"
          >
            GESTIONAR CANCHAS
          </Link>
          <Link
            href="/admin/timeslots"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center"
          >
            CONFIGURAR HORARIOS
          </Link>
          <Link
            href="/admin/pricing"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center"
          >
            GESTIONAR PRECIOS
          </Link>
          <Link
            href="/admin/reservations"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center"
          >
            VER RESERVAS
          </Link>
          <Link
            href="/admin/blocked-dates"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-4 px-6 rounded-md hover:bg-[#c5db23] transition-colors text-center"
          >
            BLOQUEAR FECHAS
          </Link>
          <Link
            href="/"
            className="bg-white/10 text-white font-heading text-[18px] py-4 px-6 rounded-md hover:bg-white/20 transition-colors text-center border border-white/20"
          >
            VER SITIO PÚBLICO
          </Link>
        </div>
      </div>

      {/* Recent Reservations */}
      <div>
        <h2 className="font-heading text-[20px] sm:text-[24px] text-white mb-4">PRÓXIMAS RESERVAS</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <RecentReservations />
        </div>
      </div>
    </div>
  );
}

async function RecentReservations() {
  const supabase = await createServerClient();

  const { data: reservations } = await supabase
    .from('reservations')
    .select(
      `
      *,
      courts (name)
    `
    )
    .eq('status', 'confirmed')
    .gte('reservation_date', new Date().toISOString().split('T')[0])
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(5);

  if (!reservations || reservations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="font-body text-[14px] text-gray-400">
          No hay reservas próximas
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left font-heading text-[12px] lg:text-[14px] text-white">
                FECHA
              </th>
              <th className="px-4 lg:px-6 py-3 text-left font-heading text-[12px] lg:text-[14px] text-white">
                HORA
              </th>
              <th className="px-4 lg:px-6 py-3 text-left font-heading text-[12px] lg:text-[14px] text-white">
                CANCHA
              </th>
              <th className="px-4 lg:px-6 py-3 text-left font-heading text-[12px] lg:text-[14px] text-white">
                CLIENTE
              </th>
              <th className="px-4 lg:px-6 py-3 text-left font-heading text-[12px] lg:text-[14px] text-white">
                PRECIO
              </th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-t border-white/10">
                <td className="px-4 lg:px-6 py-4 font-body text-[12px] lg:text-[14px] text-white">
                  {new Date(reservation.reservation_date).toLocaleDateString('es-UY')}
                </td>
                <td className="px-4 lg:px-6 py-4 font-body text-[12px] lg:text-[14px] text-white">
                  {reservation.start_time}
                </td>
                <td className="px-4 lg:px-6 py-4 font-body text-[12px] lg:text-[14px] text-white">
                  {reservation.courts?.name}
                </td>
                <td className="px-4 lg:px-6 py-4 font-body text-[12px] lg:text-[14px] text-white">
                  {reservation.customer_name}
                </td>
                <td className="px-4 lg:px-6 py-4 font-body text-[12px] lg:text-[14px] text-[#dbf228]">
                  ${reservation.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-white/10">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-heading text-[12px] text-gray-400">FECHA</p>
                <p className="font-body text-[14px] text-white">
                  {new Date(reservation.reservation_date).toLocaleDateString('es-UY')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-[12px] text-gray-400">PRECIO</p>
                <p className="font-body text-[16px] text-[#dbf228]">${reservation.price}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-heading text-[12px] text-gray-400">HORA</p>
                <p className="font-body text-[14px] text-white">{reservation.start_time}</p>
              </div>
              <div className="text-right">
                <p className="font-heading text-[12px] text-gray-400">CANCHA</p>
                <p className="font-body text-[14px] text-white">{reservation.courts?.name}</p>
              </div>
            </div>
            <div>
              <p className="font-heading text-[12px] text-gray-400">CLIENTE</p>
              <p className="font-body text-[14px] text-white">{reservation.customer_name}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
