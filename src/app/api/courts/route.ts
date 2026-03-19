import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: courts, error } = await supabase
      .from('courts')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching courts:', error);
      return NextResponse.json(
        { error: 'Error al cargar canchas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      courts: courts || [],
    });
  } catch (error: any) {
    console.error('Error fetching courts:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
