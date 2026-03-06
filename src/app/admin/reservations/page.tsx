import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ReservationsList } from './ReservationsList';

export default async function ReservationsPage() {
  const supabase = await createServerClient();

  // Get ALL reservations (past and future), ordered by most recent first
  const [reservationsResponse, courtsResponse] = await Promise.all([
    supabase
      .from('reservations')
      .select(`
        *,
        courts (name),
        user_profiles!reservations_user_id_fkey (full_name, email, phone)
      `)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: false }),
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
  ]);

  // Log errors for debugging
  if (reservationsResponse.error) {
    console.error('Error fetching reservations:', reservationsResponse.error);
  }
  if (courtsResponse.error) {
    console.error('Error fetching courts:', courtsResponse.error);
  }

  const reservations = reservationsResponse.data || [];
  const courts = courtsResponse.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[40px] text-white">RESERVAS</h1>
          <p className="font-body text-[16px] text-gray-400 mt-2">
            Gestiona todas las reservas del polideportivo
          </p>
        </div>
        <Link
          href="/admin/reservations/new"
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          + NUEVA RESERVA
        </Link>
      </div>

      <ReservationsList initialReservations={reservations} courts={courts} />
    </div>
  );
}
