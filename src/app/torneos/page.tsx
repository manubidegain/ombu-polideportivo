import { createServerClient } from '@/lib/supabase/server';
import { format, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default async function TorneosPage() {
  const supabase = await createServerClient();

  // Fetch all tournaments that are not cancelled
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .neq('status', 'cancelled')
    .order('start_date', { ascending: true });

  // Group tournaments by month (0-11)
  const tournamentsByMonth: Record<number, typeof tournaments> = {};
  tournaments?.forEach((tournament) => {
    const month = getMonth(new Date(tournament.start_date));
    if (!tournamentsByMonth[month]) {
      tournamentsByMonth[month] = [];
    }
    tournamentsByMonth[month].push(tournament);
  });

  // Get the next upcoming tournament
  const now = new Date();
  const upcomingTournament = tournaments?.find(
    (t) => new Date(t.start_date) >= now && t.status === 'registration_open'
  );

  // Predefined tournament schedule from design
  const months = [
    { name: 'FEBRERO', number: 1, dates: '20, 21 Y 22', tournamentName: 'TORNEO CARNAVAL', enabled: true },
    { name: 'MARZO', number: 2, dates: '20, 21 Y 22', tournamentName: 'TORNEO SALUS', enabled: false },
    { name: 'ABRIL', number: 3, dates: '24, 25 Y 26', tournamentName: 'TORNEO PASCUAS', enabled: true },
    { name: 'MAYO', number: 4, dates: '15, 16 Y 17', tournamentName: 'TORNEO *NOMBRE', enabled: false },
    { name: 'JUNIO', number: 5, dates: '19, 20 Y 21', tournamentName: 'TORNEO *NOMBRE', enabled: true },
    { name: 'JULIO', number: 6, dates: '10, 11 Y 12', tournamentName: 'TORNEO INVIERNO', enabled: false },
    { name: 'AGOSTO', number: 7, dates: '21, 22 Y 23', tournamentName: 'TORNEO *NOMBRE', enabled: true },
    { name: 'SETIEMBRE', number: 8, dates: '18, 19 Y 20', tournamentName: 'TORNEO *NOMBRE', enabled: false },
    { name: 'OCTUBRE', number: 9, dates: '16, 17 Y 18', tournamentName: 'TORNEO *NOMBRE', enabled: true },
    { name: 'NOVIEMBRE', number: 10, dates: '20, 21 Y 22', tournamentName: 'TORNEO *NOMBRE', enabled: false },
    { name: 'DICIEMBRE', number: 11, dates: '18, 19 Y 20', tournamentName: 'TORNEO NAVIDAD', enabled: true },
  ];

  return (
    <div className="min-h-screen bg-[#ededed]">
      {/* Hero Section */}
      <div className="relative bg-[#1b1b1b] py-12 md:py-16 px-4">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#1b1b1b]" />
          <img
            src="https://www.figma.com/api/mcp/asset/50c7a059-7a3d-4d60-8dfd-46a6e3bcd450"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        </div>

        <div className="max-w-[1344px] mx-auto relative z-10">
          <div className="flex flex-col gap-[100px] md:gap-[134px] items-center">
            {/* Tournament Info */}
            <div className="flex flex-col gap-4 items-center w-full text-center">
              <div className="flex flex-col items-center leading-normal uppercase text-white w-full">
                <h1 className="font-heading text-[32px] md:text-[48px] mb-0">
                  {upcomingTournament ? 'PRÓXIMO TORNEO:' : 'PRÓXIMOS TORNEOS'}
                </h1>
                {upcomingTournament && (
                  <p className="font-body text-[36px] md:text-[54px] font-bold">
                    {format(new Date(upcomingTournament.start_date), 'd', { locale: es })}
                    {upcomingTournament.end_date &&
                      `, ${format(new Date(upcomingTournament.end_date), 'd', { locale: es })}`}{' '}
                    DE {format(new Date(upcomingTournament.start_date), 'MMMM', { locale: es }).toUpperCase()}
                  </p>
                )}
              </div>
              {upcomingTournament && (
                <Link
                  href={`/torneos/${upcomingTournament.id}`}
                  className="inline-flex items-center bg-white text-[#1b1b1b] font-heading text-[16px] md:text-[20px] py-3 px-12 md:py-4 md:px-20 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  SUMÁTE
                </Link>
              )}
            </div>

            {/* Scroll indicator */}
            <div className="flex flex-col gap-[10px] items-center w-full">
              <p className="font-body text-[16px] md:text-[20px] text-white text-center leading-normal">
                PRÓXIMOS TORNEOS
              </p>
              <div className="flex h-[26px] w-[52px] items-center justify-center">
                <div className="-scale-y-100 rotate-90">
                  <img
                    src="https://www.figma.com/api/mcp/asset/34bf7634-5f1f-4138-92c4-0a315313d84b"
                    alt=""
                    className="h-[52px] w-[26px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section with Images */}
      <div className="bg-[#ededed] py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Left Image */}
          <div className="flex-1 rounded-lg overflow-hidden">
            <img
              src="https://www.figma.com/api/mcp/asset/d31e085b-c3d4-4aff-ba8b-f9010d5f0086"
              alt="Torneo de pádel"
              className="w-full h-[400px] md:h-[712px] object-cover"
            />
          </div>

          {/* Right Column */}
          <div className="flex-1 flex flex-col gap-6 md:gap-10">
            {/* Top Image */}
            <div className="rounded-lg overflow-hidden">
              <img
                src="https://www.figma.com/api/mcp/asset/b513da94-5a04-4337-99a1-46f92b62de31"
                alt="Jugadores de pádel"
                className="w-full h-[250px] md:h-[391px] object-cover"
              />
            </div>

            {/* Text */}
            <div>
              <h2 className="font-heading text-[28px] md:text-[48px] text-[#1b1b1b] mb-4 md:mb-5 uppercase leading-tight">
                CADA TORNEO SE SIENTE ESPECIAL
              </h2>
              <p className="font-body text-[16px] md:text-[20px] text-[#1b1b1b] leading-relaxed">
                Nos encanta ver como disfrutas de nuestra casa, si vos, que estas sentado afuera
                partido tras partido. Es un placer que disfrutes tanto como nosotros tenerte,
                porque el Ombú es eso, un lugar para estar entre amigos y familia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments Calendar */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="font-heading text-[28px] md:text-[40px] text-[#1b1b1b] text-center mb-8 md:mb-12 uppercase">
          PRÓXIMOS TORNEOS
        </h2>

        <div className="space-y-4 md:space-y-6">
          {months.map((month) => {
            const monthTournaments = tournamentsByMonth[month.number] || [];
            // Check if there's an actual tournament created in the system for this month
            const systemTournament = monthTournaments[0];
            // Use system tournament if exists, otherwise show design template
            const isEnabled = month.enabled;
            const canRegister = systemTournament && systemTournament.status === 'registration_open';

            return (
              <div
                key={month.number}
                className={`border-[3px] md:border-[5px] flex flex-col md:flex-row items-stretch min-h-[120px] ${
                  isEnabled ? 'border-[#1b1b1b]' : 'border-[#3e3d3d]'
                }`}
              >
                {/* Month */}
                <div
                  className={`flex items-center justify-center w-full md:w-[332px] py-3 md:py-0 ${
                    isEnabled ? 'bg-[#1b1b1b]' : 'bg-[#3e3d3d]'
                  }`}
                >
                  <p className="font-heading text-[24px] md:text-[32px] text-white">{month.name}</p>
                </div>

                {/* Dates and Tournament Name - Mobile: Column, Desktop: Row */}
                <div className="flex flex-col md:flex-row flex-1">
                  {/* Dates */}
                  <div className="flex items-center justify-center py-3 md:py-0 md:w-[283px] border-t md:border-t-0 md:border-l-0 border-[#ededed]">
                    <p
                      className={`font-body text-[20px] md:text-[32px] font-bold ${
                        isEnabled ? 'text-[#1b1b1b]' : 'text-[#3e3d3d]'
                      }`}
                    >
                      {month.dates}
                    </p>
                  </div>

                  {/* Tournament Name and Action */}
                  <div className="flex items-center justify-between md:justify-center gap-4 flex-1 px-4 py-3 md:py-0 border-t md:border-t-0 border-[#ededed]">
                    <p
                      className={`font-body text-[16px] md:text-[24px] font-medium text-center ${
                        isEnabled ? 'text-[#1b1b1b]' : 'text-[#3e3d3d]'
                      }`}
                    >
                      {systemTournament ? systemTournament.name.toUpperCase() : month.tournamentName}
                    </p>

                    {/* Registration Button */}
                    {canRegister && (
                      <Link
                        href={`/torneos/${systemTournament.id}`}
                        className="bg-[#1b1b1b] text-white font-body text-[12px] md:text-[14px] py-2 px-4 md:px-6 rounded hover:bg-[#2b2b2b] transition-colors whitespace-nowrap"
                      >
                        INSCRIBIRSE
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
