import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { MyReservationsList } from './MyReservationsList';

export default async function MisReservasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createServerClient();

  // Get reservations where user is owner
  const { data: ownedReservations } = await supabase
    .from('reservations')
    .select(
      `
      *,
      courts (name, type)
    `
    )
    .eq('user_id', user.id);

  // Get reservations where user is invited as a player (only confirmed)
  const { data: invitedPlayers } = await supabase
    .from('reservation_players')
    .select(
      `
      reservation_id,
      reservations (
        *,
        courts (name, type)
      )
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'confirmed');

  // Combine both lists and remove duplicates
  const invitedReservations = invitedPlayers
    ?.map((p) => p.reservations)
    .filter((r): r is NonNullable<typeof r> => r !== null) || [];

  const allReservations = [...(ownedReservations || []), ...invitedReservations];

  // Remove duplicates by id
  const uniqueReservations = Array.from(
    new Map(allReservations.map((r) => [r.id, r])).values()
  );

  // Sort by date
  const reservations = uniqueReservations.sort((a, b) => {
    const dateA = new Date(`${a.reservation_date}T${a.start_time}`);
    const dateB = new Date(`${b.reservation_date}T${b.start_time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-[48px] text-white mb-4">MIS RESERVAS</h1>
          <p className="font-body text-[18px] text-gray-400">
            Administrá tus reservas y las que te invitaron
          </p>
        </div>

        <MyReservationsList reservations={reservations || []} />
      </div>
    </div>
  );
}
