import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { ProfileTabs } from './ProfileTabs';
import { getUserAchievements } from '@/lib/tournaments/achievements';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerClient();

  // Fetch user's tournaments (as player)
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select(
      `
      id,
      status,
      category:tournament_categories (
        id,
        name,
        tournament:tournaments (
          id,
          name,
          start_date,
          end_date,
          status,
          sport_type
        )
      )
    `
    )
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);

  // Fetch user's matches
  const { data: matches } = await supabase
    .from('tournament_matches')
    .select(
      `
      id,
      status,
      scheduled_date,
      scheduled_time,
      score,
      tournament:tournaments (
        id,
        name,
        sport_type
      ),
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        id,
        team_name,
        player_names
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        id,
        team_name,
        player_names
      ),
      winner:tournament_registrations!tournament_matches_winner_id_fkey (
        id
      )
    `
    )
    .or(`team1.player1_id.eq.${user.id},team1.player2_id.eq.${user.id},team2.player1_id.eq.${user.id},team2.player2_id.eq.${user.id}`)
    .order('scheduled_date', { ascending: false })
    .limit(10);

  // Fetch user's achievements
  const achievements = await getUserAchievements(user.id);

  // Fetch user's court reservations
  const { data: reservations } = await supabase
    .from('reservations')
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      court:courts (
        name,
        sport_type
      )
    `
    )
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })
    .limit(10);

  // Calculate stats
  const totalTournaments = registrations?.length || 0;
  const totalMatches = matches?.length || 0;
  const totalAchievements = achievements.length;

  // Count wins
  const wins = matches?.filter((match) => {
    const isTeam1 = match.team1?.id &&
      (registrations?.some(r => r.id === match.team1.id) || false);
    const isTeam2 = match.team2?.id &&
      (registrations?.some(r => r.id === match.team2.id) || false);

    if (match.winner?.id) {
      if (isTeam1 && match.winner.id === match.team1.id) return true;
      if (isTeam2 && match.winner.id === match.team2.id) return true;
    }
    return false;
  })?.length || 0;

  const profileData = {
    user: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    stats: {
      totalTournaments,
      totalMatches,
      totalAchievements,
      wins,
      winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
    },
    registrations: registrations || [],
    matches: matches || [],
    achievements,
    reservations: reservations || [],
  };

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#dbf228] to-[#c5db23] rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#1b1b1b] flex items-center justify-center text-white font-heading text-[36px] overflow-hidden">
              {profileData.user.avatar_url ? (
                <img
                  src={profileData.user.avatar_url}
                  alt={profileData.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profileData.user.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="font-heading text-[42px] text-[#1b1b1b] mb-2">
                {profileData.user.name.toUpperCase()}
              </h1>
              <p className="font-body text-[16px] text-[#1b1b1b]/70">
                {profileData.user.email}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="font-heading text-[32px] text-[#1b1b1b]">
                  {profileData.stats.totalTournaments}
                </p>
                <p className="font-body text-[12px] text-[#1b1b1b]/70">Torneos</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-[32px] text-[#1b1b1b]">
                  {profileData.stats.totalAchievements}
                </p>
                <p className="font-body text-[12px] text-[#1b1b1b]/70">Logros</p>
              </div>
              <div className="text-center">
                <p className="font-heading text-[32px] text-[#1b1b1b]">
                  {profileData.stats.winRate}%
                </p>
                <p className="font-body text-[12px] text-[#1b1b1b]/70">Victorias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <ProfileTabs data={profileData} />
      </div>
    </div>
  );
}
