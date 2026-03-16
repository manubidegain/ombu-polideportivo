import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify admin
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tournamentId,
      categoryId,
      teamName,
      player1Email,
      player1Name,
      player2Email,
      player2Name,
      contactPhone,
    } = body;

    // Validate required fields
    if (
      !tournamentId ||
      !categoryId ||
      !teamName ||
      !player1Email ||
      !player1Name ||
      !player2Email ||
      !player2Name
    ) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Validate emails are different
    if (player1Email.toLowerCase() === player2Email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Los correos de los jugadores deben ser diferentes' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const serviceSupabase = await createServerClient(true); // Service role for creating users

    // Check if category is full
    const { data: category } = await supabase
      .from('tournament_categories')
      .select('id, max_teams')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const { count: currentRegistrations } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'confirmed');

    if (currentRegistrations && currentRegistrations >= category.max_teams) {
      return NextResponse.json({ error: 'La categoría está llena' }, { status: 400 });
    }

    // Process both players
    const player1LowerEmail = player1Email.toLowerCase();
    const player2LowerEmail = player2Email.toLowerCase();

    // Check/create player 1
    const { data: player1List } = await serviceSupabase.auth.admin.listUsers();
    const player1Existing = player1List?.users?.find((u) => u.email === player1LowerEmail);
    let player1Id: string;

    if (!player1Existing) {
      // Create phantom user for player 1
      const { data: newUser1, error: createError1 } = await serviceSupabase.auth.admin.createUser({
        email: player1LowerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: player1Name,
          is_phantom: true,
          created_by_tournament: tournamentId,
          created_by_admin: user.id,
        },
      });

      if (createError1 || !newUser1.user) {
        console.error('Error creating player 1:', createError1);
        return NextResponse.json(
          { error: `Error creando cuenta para ${player1Email}` },
          { status: 500 }
        );
      }

      player1Id = newUser1.user.id;

      // Create user profile for player 1
      await supabase.from('user_profiles').insert({
        id: player1Id,
        email: player1LowerEmail,
        full_name: player1Name,
        email_notifications: true,
        whatsapp_notifications: false,
      });
    } else {
      player1Id = player1Existing.id;
    }

    // Check/create player 2
    const { data: player2List } = await serviceSupabase.auth.admin.listUsers();
    const player2Existing = player2List?.users?.find((u) => u.email === player2LowerEmail);
    let player2Id: string;

    if (!player2Existing) {
      // Create phantom user for player 2
      const { data: newUser2, error: createError2 } = await serviceSupabase.auth.admin.createUser({
        email: player2LowerEmail,
        email_confirm: true,
        user_metadata: {
          full_name: player2Name,
          is_phantom: true,
          created_by_tournament: tournamentId,
          created_by_admin: user.id,
        },
      });

      if (createError2 || !newUser2.user) {
        console.error('Error creating player 2:', createError2);
        return NextResponse.json(
          { error: `Error creando cuenta para ${player2Email}` },
          { status: 500 }
        );
      }

      player2Id = newUser2.user.id;

      // Create user profile for player 2
      await supabase.from('user_profiles').insert({
        id: player2Id,
        email: player2LowerEmail,
        full_name: player2Name,
        email_notifications: true,
        whatsapp_notifications: false,
      });
    } else {
      player2Id = player2Existing.id;
    }

    // Create the registration directly as confirmed (admin bypass)
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        category_id: categoryId,
        team_type: 'pair',
        team_name: teamName,
        player1_id: player1Id,
        player2_id: player2Id,
        player_names: [player1Name, player2Name],
        contact_email: player1LowerEmail,
        contact_phone: contactPhone || null,
        status: 'confirmed',
        registered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (regError) {
      console.error('Registration error:', regError);
      return NextResponse.json(
        { error: 'Error al crear inscripción: ' + regError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration,
      message: 'Pareja agregada exitosamente',
    });
  } catch (error: any) {
    console.error('Admin tournament registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
