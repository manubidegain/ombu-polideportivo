import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import {
  rankGroupTeams,
  selectPlayoffQualifiers,
  seedPlayoffTeams,
  areAllGroupsComplete,
  type MatchResult,
} from '@/lib/tournaments/ranking-calculator';
import {
  generatePlayoffBracket,
  validateBracket,
  formatBracketForDatabase,
} from '@/lib/tournaments/bracket-generator';
import { createSeries } from '@/lib/tournaments/fixture-generator';
import { getPlayoffStructure } from '@/lib/tournaments/playoff-rules';

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
    const { categoryId, qualificationRule, useAutoRules = false } = body;

    if (!categoryId || !qualificationRule) {
      return NextResponse.json(
        { error: 'Se requiere categoryId y qualificationRule' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get all group series for this category
    const { data: groupSeries } = await supabase
      .from('tournament_series')
      .select(
        `
        id,
        name,
        tournament_series_teams (
          registration_id,
          tournament_registrations (
            id,
            team_name
          )
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('phase', 'groups');

    if (!groupSeries || groupSeries.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron grupos para esta categoría' },
        { status: 404 }
      );
    }

    // Get all matches for these groups
    const seriesIds = groupSeries.map((s) => s.id);
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .in('series_id', seriesIds);

    if (!matches) {
      return NextResponse.json({ error: 'No se encontraron partidos' }, { status: 404 });
    }

    // Group matches by series
    const matchesBySeries: Record<string, MatchResult[]> = {};
    for (const series of groupSeries) {
      matchesBySeries[series.id] = matches
        .filter((m) => m.series_id === series.id)
        .map((m) => ({
          id: m.id,
          team1Id: m.team1_id,
          team2Id: m.team2_id,
          winnerId: m.winner_id,
          score: m.score as MatchResult['score'],
        }));
    }

    // Check if all groups are complete
    if (!areAllGroupsComplete(matchesBySeries)) {
      return NextResponse.json(
        { error: 'No todos los partidos de grupos están completos' },
        { status: 400 }
      );
    }

    // Calculate standings for each group
    const allGroupStandings = [];

    for (const series of groupSeries) {
      const teams = series.tournament_series_teams.map((st: any) => ({
        id: st.registration_id,
        name: st.tournament_registrations.team_name || 'Sin nombre',
      }));

      const standings = rankGroupTeams(
        teams,
        series.id,
        series.name,
        matchesBySeries[series.id]
      );

      allGroupStandings.push(standings);
    }

    // Select playoff qualifiers
    const qualifiers = selectPlayoffQualifiers(allGroupStandings, qualificationRule);

    if (qualifiers.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 equipos para playoffs' },
        { status: 400 }
      );
    }

    // Seed qualifiers
    const seededQualifiers = seedPlayoffTeams(qualifiers);

    // Generate bracket
    const bracket = generatePlayoffBracket(tournamentId, categoryId, seededQualifiers);

    // Validate bracket
    const validation = validateBracket(bracket);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Bracket inválido', details: validation.errors },
        { status: 500 }
      );
    }

    // Determine playoff structure
    let playoffStructure: any = null;
    if (useAutoRules) {
      playoffStructure = getPlayoffStructure(qualifiers.length);
      if (!playoffStructure.supported) {
        return NextResponse.json(
          { error: playoffStructure.errorMessage || 'Estructura de playoffs no soportada' },
          { status: 400 }
        );
      }

      // For now, only support structures that fit in the current bracket generator (2-8 teams)
      // This excludes 9, 12, and 15 team structures until bracket-generator is extended
      if (qualifiers.length > 8) {
        return NextResponse.json(
          {
            error:
              'El sistema automático actualmente solo soporta hasta 8 equipos. Usá el modo manual para más equipos.',
          },
          { status: 400 }
        );
      }
    }

    // Create playoff series dynamically based on structure
    type PlayoffSeriesIds = {
      octavos?: string;
      cuartos?: string;
      quarterFinals?: string;
      semiFinals: string;
      final: string;
    };
    const playoffSeriesIds: PlayoffSeriesIds = {
      semiFinals: '',
      final: '',
    };

    let currentOrder = 1;

    // If using auto rules, create series based on rounds
    if (useAutoRules && playoffStructure) {
      for (const round of playoffStructure.rounds) {
        if (round.name === 'Octavos') {
          const octSeries = await createSeries(
            tournamentId,
            categoryId,
            'Octavos de Final',
            currentOrder++,
            round.qualifiersNeeded,
            'playoffs'
          );
          playoffSeriesIds.octavos = octSeries.id;
        } else if (round.name === 'Cuartos' || round.name === 'Cuarto') {
          const qfSeries = await createSeries(
            tournamentId,
            categoryId,
            round.name === 'Cuartos' ? 'Cuartos de Final' : 'Cuarto de Final',
            currentOrder++,
            round.qualifiersNeeded,
            'playoffs'
          );
          playoffSeriesIds.cuartos = qfSeries.id;
          playoffSeriesIds.quarterFinals = qfSeries.id; // Alias for compatibility
        } else if (round.name === 'Semis') {
          const sfSeries = await createSeries(
            tournamentId,
            categoryId,
            'Semifinales',
            currentOrder++,
            round.qualifiersNeeded,
            'playoffs'
          );
          playoffSeriesIds.semiFinals = sfSeries.id;
        } else if (round.name === 'Final') {
          const finalSeries = await createSeries(
            tournamentId,
            categoryId,
            'Final',
            currentOrder++,
            round.qualifiersNeeded,
            'finals'
          );
          playoffSeriesIds.final = finalSeries.id;
        }
      }
    } else {
      // Manual mode: use existing logic
      if (bracket.quarterFinals.length > 0) {
        const qfSeries = await createSeries(
          tournamentId,
          categoryId,
          'Cuartos de Final',
          currentOrder++,
          8,
          'playoffs'
        );
        playoffSeriesIds.quarterFinals = qfSeries.id;
      }

      const sfSeries = await createSeries(
        tournamentId,
        categoryId,
        'Semifinales',
        currentOrder++,
        4,
        'playoffs'
      );
      playoffSeriesIds.semiFinals = sfSeries.id;

      const finalSeries = await createSeries(
        tournamentId,
        categoryId,
        'Final',
        currentOrder++,
        2,
        'finals'
      );
      playoffSeriesIds.final = finalSeries.id;
    }

    // Format and save matches
    const playoffMatches = formatBracketForDatabase(bracket, playoffSeriesIds);

    const { error: insertError } = await supabase
      .from('tournament_matches')
      .insert(playoffMatches);

    if (insertError) {
      console.error('Error inserting playoff matches:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar partidos de playoffs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qualifierCount: qualifiers.length,
      totalMatches: bracket.totalMatches,
      bracket: {
        quarterFinalsCount: bracket.quarterFinals.length,
        semiFinalsCount: bracket.semiFinals.length,
        hasFinal: true,
      },
      qualifiers: seededQualifiers.map((q, index) => ({
        seed: index + 1,
        teamName: q.teamName,
        groupName: q.groupName,
        groupRank: q.groupRank,
      })),
    });
  } catch (error: any) {
    console.error('Error generating playoffs:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
