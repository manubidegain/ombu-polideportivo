import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import {
  suggestGroupConfiguration,
  validateGroupConfiguration,
  distributeTeamsIntoGroups,
} from '@/lib/tournaments/group-optimizer';
import {
  createSeries,
  assignTeamsToSeries,
  generateRoundRobinMatches,
  assignTimeSlots,
  saveMatches,
} from '@/lib/tournaments/fixture-generator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const body = await request.json();
    const {
      categoryId,
      teamIds,
      teamsPerGroup, // Optional: admin override
      distributionMethod = 'snake',
      assignSchedule = true,
      generateMatches = false, // NEW: Only generate matches if explicitly requested
    } = body;

    if (!categoryId || !teamIds || teamIds.length < 3) {
      return NextResponse.json(
        { error: 'Se requiere categoryId y al menos 3 equipos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get tournament details
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Determine group configuration
    let groupConfig;
    if (teamsPerGroup) {
      // Admin provided custom configuration
      const validation = validateGroupConfiguration(teamIds.length, teamsPerGroup);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      groupConfig = {
        groupCount: teamsPerGroup.length,
        teamsPerGroup,
        totalMatches: teamsPerGroup.reduce((sum: number, count: number) => sum + (count * (count - 1)) / 2, 0),
        distribution: 'custom' as const,
      };
    } else {
      // Auto-suggest optimal configuration
      groupConfig = suggestGroupConfiguration(teamIds.length);
    }

    // Distribute teams into groups
    const distribution = distributeTeamsIntoGroups(
      teamIds,
      groupConfig.teamsPerGroup,
      distributionMethod
    );

    // Fetch team data for match generation
    const { data: teams } = await supabase
      .from('tournament_registrations')
      .select('id, team_name')
      .in('id', teamIds);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: 'No se encontraron equipos' }, { status: 404 });
    }

    const teamMap = new Map(teams.map((t) => [t.id, t.team_name]));

    // Create series and matches for each group
    const createdGroups = [];

    for (const group of distribution.groups) {
      // 1. Create series
      const series = await createSeries(
        tournamentId,
        categoryId,
        group.name,
        parseInt(group.id.split('-')[1]),
        group.teams.length,
        'groups'
      );

      // 2. Assign teams to series
      await assignTeamsToSeries(series.id, group.teams);

      let matchCount = 0;
      let scheduledMatchCount = 0;

      // 3. Generate matches only if requested
      if (generateMatches) {
        // 3a. Generate round-robin matches
        const groupTeams = group.teams
          .map((teamId) => ({
            id: teamId,
            team_name: teamMap.get(teamId) || '',
          }))
          .filter((t) => t.team_name);

        let matches = generateRoundRobinMatches(groupTeams, tournamentId, series.id);

        // 3b. Assign time slots if requested
        if (assignSchedule && tournament.start_date) {
          matches = await assignTimeSlots(
            matches,
            tournamentId,
            tournament.start_date,
            tournament.end_date || undefined
          );
        }

        // 3c. Save matches
        await saveMatches(matches);

        matchCount = matches.length;
        scheduledMatchCount = matches.filter((m) => m.scheduled_date).length;
      }

      createdGroups.push({
        seriesId: series.id,
        groupName: group.name,
        teamCount: group.teams.length,
        matchCount,
        scheduledMatches: scheduledMatchCount,
      });
    }

    return NextResponse.json({
      success: true,
      groupCount: distribution.groups.length,
      totalMatches: groupConfig.totalMatches,
      groups: createdGroups,
    });
  } catch (error: any) {
    console.error('Error generating groups:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
