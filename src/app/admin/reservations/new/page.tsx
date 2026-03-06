import { createServerClient } from '@/lib/supabase/server';
import { ReservationForm } from '../ReservationForm';

export default async function NewReservationPage() {
  const supabase = await createServerClient();

  const [{ data: courts }, { data: users }] = await Promise.all([
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
    supabase.from('user_profiles').select('id, full_name, email').order('full_name'),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">NUEVA RESERVA</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Crea una reserva manualmente para un usuario
        </p>
      </div>

      <ReservationForm courts={courts || []} users={users || []} />
    </div>
  );
}
