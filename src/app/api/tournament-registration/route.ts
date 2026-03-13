import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tournamentId,
      categoryId,
      teamName,
      player1Id,
      player1Email,
      player2Email,
      contactPhone,
      unavailableSlotIds,
    } = body;

    // Validate required fields
    if (!tournamentId || !categoryId || !teamName || !player1Email || !player2Email) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Check if player 2 exists
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', player2Email.toLowerCase())
      .limit(1);

    let player2Id: string;
    let isPhantomAccount = false;

    if (existingUsers && existingUsers.length > 0) {
      // Player 2 has an account
      player2Id = existingUsers[0].id;
    } else {
      // Create phantom account using service role
      const serviceSupabase = await createServerClient(true); // Use service role

      const { data: phantomUser, error: phantomError } =
        await serviceSupabase.auth.admin.createUser({
          email: player2Email.toLowerCase(),
          email_confirm: true,
          user_metadata: {
            is_phantom: true,
            created_by_tournament: tournamentId,
            created_by_user: player1Id,
          },
        });

      if (phantomError) {
        return NextResponse.json(
          { error: `Error creando cuenta: ${phantomError.message}` },
          { status: 500 }
        );
      }

      if (!phantomUser.user) {
        return NextResponse.json(
          { error: 'No se pudo crear la cuenta del compañero' },
          { status: 500 }
        );
      }

      player2Id = phantomUser.user.id;
      isPhantomAccount = true;

      // Create user profile
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: player2Id,
        email: player2Email.toLowerCase(),
        email_notifications: true,
        whatsapp_notifications: false,
      });

      if (profileError) {
        console.error('Error creating phantom profile:', profileError);
      }
    }

    // Create tournament registration
    const { error: registrationError } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        category_id: categoryId,
        team_name: teamName,
        team_type: 'pair',
        player1_id: player1Id,
        player2_id: player2Id,
        player_names: [player1Email, player2Email],
        contact_email: player1Email,
        contact_phone: contactPhone,
        unavailable_slot_ids: unavailableSlotIds,
        status: 'confirmed',
      });

    if (registrationError) {
      return NextResponse.json(
        { error: `Error al crear inscripción: ${registrationError.message}` },
        { status: 500 }
      );
    }

    // Send welcome email to phantom account
    if (isPhantomAccount) {
      try {
        // Generate password reset link
        const { data: resetData } = await supabase.auth.resetPasswordForEmail(player2Email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
        });

        // TODO: Send custom welcome email with reset link
        // For now, they'll receive the standard password reset email
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      isPhantomAccount,
      message: 'Inscripción creada exitosamente',
    });
  } catch (error) {
    console.error('Error in tournament registration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
