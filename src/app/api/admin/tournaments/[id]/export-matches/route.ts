import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    // Fetch all matches with related data
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_matches')
      .select(
        `
        *,
        team1:tournament_registrations!tournament_matches_team1_id_fkey (
          team_name,
          player_names
        ),
        team2:tournament_registrations!tournament_matches_team2_id_fkey (
          team_name,
          player_names
        ),
        court:courts (name),
        series:tournament_series (
          name,
          phase,
          tournament_categories (name)
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .order('scheduled_date')
      .order('scheduled_time');

    if (matchesError) {
      throw matchesError;
    }

    // Sort by category and series
    const sortedMatches = (matches || []).sort((a: any, b: any) => {
      const catA = a.series?.tournament_categories?.name || 'ZZZ';
      const catB = b.series?.tournament_categories?.name || 'ZZZ';
      const catCompare = catA.localeCompare(catB, 'es', { numeric: true });
      if (catCompare !== 0) return catCompare;

      const seriesA = a.series?.name || 'ZZZ';
      const seriesB = b.series?.name || 'ZZZ';
      return seriesA.localeCompare(seriesB, 'es', { numeric: true });
    });

    // Generate CSV
    const csvRows: string[] = [];

    // Headers
    csvRows.push(
      [
        'Categoría',
        'Serie',
        'Fase',
        'Equipo 1',
        'Jugadores Equipo 1',
        'Equipo 2',
        'Jugadores Equipo 2',
        'Fecha',
        'Hora',
        'Cancha',
        'Estado',
        'Resultado',
      ].join(',')
    );

    // Helper to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Helper to format player names
    const formatPlayerNames = (playerNames: any): string => {
      if (!playerNames || !Array.isArray(playerNames)) return '';
      return playerNames.filter(Boolean).join(' / ');
    };

    // Helper to format score
    const formatScore = (match: any): string => {
      if (!match.score || match.status !== 'completed') return '';
      const score = match.score as any;
      let result = '';

      if (score.sets && Array.isArray(score.sets)) {
        result = score.sets
          .map((set: any) => `${set.team1}-${set.team2}`)
          .join(' ');

        if (score.supertiebreak) {
          result += ` ST:${score.supertiebreak.team1}-${score.supertiebreak.team2}`;
        }
      }

      return result;
    };

    // Helper to get status text
    const getStatusText = (status: string): string => {
      const statusMap: Record<string, string> = {
        scheduled: 'Programado',
        in_progress: 'En Juego',
        completed: 'Finalizado',
        cancelled: 'Cancelado',
        walkover: 'W.O.',
      };
      return statusMap[status] || status;
    };

    // Helper to get phase text
    const getPhaseText = (phase: string): string => {
      const phaseMap: Record<string, string> = {
        groups: 'Grupos',
        playoffs: 'Playoffs',
        semifinals: 'Semifinales',
        finals: 'Final',
      };
      return phaseMap[phase] || phase;
    };

    // Add matches
    sortedMatches.forEach((match: any) => {
      csvRows.push(
        [
          escapeCSV(match.series?.tournament_categories?.name || 'N/A'),
          escapeCSV(match.series?.name || 'N/A'),
          escapeCSV(getPhaseText(match.series?.phase || '')),
          escapeCSV(match.team1?.team_name || 'N/A'),
          escapeCSV(formatPlayerNames(match.team1?.player_names)),
          escapeCSV(match.team2?.team_name || 'N/A'),
          escapeCSV(formatPlayerNames(match.team2?.player_names)),
          escapeCSV(
            match.scheduled_date
              ? format(parseISO(match.scheduled_date), 'd MMM yyyy', { locale: es })
              : 'Sin programar'
          ),
          escapeCSV(match.scheduled_time ? match.scheduled_time.slice(0, 5) : ''),
          escapeCSV(match.court?.name || ''),
          escapeCSV(getStatusText(match.status)),
          escapeCSV(formatScore(match)),
        ].join(',')
      );
    });

    const csv = csvRows.join('\n');

    // Create filename with tournament name and date
    const filename = `partidos_${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(
      new Date(),
      'yyyy-MM-dd'
    )}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting matches:', error);
    return NextResponse.json(
      { error: error.message || 'Error al exportar partidos' },
      { status: 500 }
    );
  }
}
