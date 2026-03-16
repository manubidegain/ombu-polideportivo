import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, avatarUrl } = body;

    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Update user metadata (auth.users table)
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name: fullName,
        full_name: fullName,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      },
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      return NextResponse.json(
        { error: 'Error al actualizar los metadatos del usuario' },
        { status: 500 }
      );
    }

    // Also update user_profiles table if it exists
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      })
      .eq('id', user.id);

    // Don't fail if profile update fails (table might not have avatar_url column)
    if (profileError) {
      console.warn('Warning updating user profile:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
