import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json({ error: 'ID de inscripción requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Delete the registration
    const { error: deleteError } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('id', registrationId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar inscripción: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inscripción eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
