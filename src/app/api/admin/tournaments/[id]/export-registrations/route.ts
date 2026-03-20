import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';
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

    // Fetch all registrations with related data
    const { data: registrations, error: registrationsError } = await supabase
      .from('tournament_registrations')
      .select(
        `
        *,
        tournament_categories (
          name
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .order('registered_at', { ascending: false });

    if (registrationsError) {
      throw registrationsError;
    }

    // Also fetch pending invitations
    const { data: invitations } = await supabase
      .from('tournament_invitations')
      .select(
        `
        *,
        tournament_categories (
          name
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Sort both by category name
    const sortedRegistrations = (registrations || []).sort((a: any, b: any) => {
      const catA = a.tournament_categories?.name || '';
      const catB = b.tournament_categories?.name || '';
      return catA.localeCompare(catB, 'es', { numeric: true });
    });

    const sortedInvitations = (invitations || []).sort((a: any, b: any) => {
      const catA = a.tournament_categories?.name || '';
      const catB = b.tournament_categories?.name || '';
      return catA.localeCompare(catB, 'es', { numeric: true });
    });

    // Generate CSV
    const csvRows: string[] = [];

    // Headers - One row per player
    csvRows.push(
      [
        'Categoría',
        'Nombre del Equipo',
        'Nombre del Jugador',
        'Email de Contacto',
        'Teléfono',
        'Estado de Inscripción',
        'Fecha de Registro',
        'Pagó',
      ].join(',')
    );

    // Helper to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Add confirmed registrations - ONE ROW PER PLAYER
    sortedRegistrations.forEach((reg: any) => {
      const playerNames = Array.isArray(reg.player_names) ? reg.player_names : [];
      const statusText = reg.status === 'confirmed'
        ? 'Confirmado'
        : reg.status === 'pending'
        ? 'Pendiente'
        : 'Cancelado';
      const registrationDate = reg.registered_at
        ? format(new Date(reg.registered_at), 'd MMM yyyy', { locale: es })
        : '';

      // Add row for each player
      playerNames.forEach((playerName: string) => {
        if (playerName) { // Only add if player name exists
          csvRows.push(
            [
              escapeCSV(reg.tournament_categories?.name || 'N/A'),
              escapeCSV(reg.team_name),
              escapeCSV(playerName),
              escapeCSV(reg.contact_email),
              escapeCSV(reg.contact_phone || ''),
              escapeCSV(statusText),
              escapeCSV(registrationDate),
              '', // Empty column for "Pagó" to be filled manually
            ].join(',')
          );
        }
      });
    });

    // Add pending invitations - ONE ROW PER PLAYER
    sortedInvitations.forEach((inv: any) => {
      const playerNames = Array.isArray(inv.player_names) ? inv.player_names : [];
      const invitationDate = inv.created_at
        ? format(new Date(inv.created_at), 'd MMM yyyy', { locale: es })
        : '';

      // If no player names, use emails
      const players = playerNames.length > 0
        ? playerNames
        : [inv.inviter_email, inv.invitee_email].filter(Boolean);

      players.forEach((playerName: string) => {
        if (playerName) {
          csvRows.push(
            [
              escapeCSV(inv.tournament_categories?.name || 'N/A'),
              escapeCSV(inv.team_name),
              escapeCSV(playerName),
              escapeCSV(inv.inviter_email),
              escapeCSV(''),
              escapeCSV('Invitación Pendiente'),
              escapeCSV(invitationDate),
              '', // Empty column for "Pagó"
            ].join(',')
          );
        }
      });
    });

    const csv = csvRows.join('\n');

    // Create filename with tournament name and date
    const filename = `inscripciones_${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(
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
    console.error('Error exporting registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Error al exportar inscripciones' },
      { status: 500 }
    );
  }
}
