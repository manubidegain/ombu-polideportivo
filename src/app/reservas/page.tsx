import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { ReservationCalendar } from './ReservationCalendar';

export default async function ReservasPage() {
  const user = await getCurrentUser();
  const supabase = await createServerClient();

  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] text-white mb-3 md:mb-4">RESERVÁ TU CANCHA</h1>
          <p className="font-body text-[14px] sm:text-[16px] md:text-[18px] text-gray-400">
            Elegí la cancha, fecha y horario que más te convenga
          </p>
        </div>

        <ReservationCalendar courts={courts || []} userId={user?.id || null} />
      </div>
    </div>
  );
}
