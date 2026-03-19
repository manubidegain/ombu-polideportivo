import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { registrationId, playerNames } = await request.json();

    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId es requerido' }, { status: 400 });
    }

    if (!playerNames || !Array.isArray(playerNames)) {
      return NextResponse.json({ error: 'playerNames debe ser un array' }, { status: 400 });
    }

    // Validate that player names are strings and not empty
    const validatedNames = playerNames
      .map((name) => String(name).trim())
      .filter((name) => name.length > 0);

    if (validatedNames.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un nombre de jugador válido' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Update player_names
    const { error } = await supabase
      .from('tournament_registrations')
      .update({
        player_names: validatedNames,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (error) {
      console.error('Error updating player names:', error);
      return NextResponse.json(
        { error: 'Error al actualizar nombres de jugadores' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update player names route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
