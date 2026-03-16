import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, newCategoryId } = body;

    if (!registrationId || !newCategoryId) {
      return NextResponse.json(
        { error: 'ID de inscripción y categoría son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if new category is full
    const { data: category } = await supabase
      .from('tournament_categories')
      .select('id, max_teams')
      .eq('id', newCategoryId)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const { count: currentRegistrations } = await supabase
      .from('tournament_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', newCategoryId)
      .eq('status', 'confirmed');

    if (currentRegistrations && currentRegistrations >= category.max_teams) {
      return NextResponse.json({ error: 'La categoría está llena' }, { status: 400 });
    }

    // Update the registration category
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({ category_id: newCategoryId })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar categoría: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
