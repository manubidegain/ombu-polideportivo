import { NextRequest, NextResponse } from 'next/server';
import { generateFixtures } from '@/lib/tournaments/fixture-generator';

export async function POST(request: NextRequest) {
  try {
    const {
      tournamentId,
      categoryId,
      teamIds,
      seriesName,
      seriesNumber,
      assignSchedule,
    } = await request.json();

    // Validate inputs
    if (!tournamentId || !categoryId || !teamIds || !seriesName || seriesNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (teamIds.length < 2) {
      return NextResponse.json(
        { error: 'Se necesitan al menos 2 equipos para generar partidos' },
        { status: 400 }
      );
    }

    // Generate fixtures
    const result = await generateFixtures(
      tournamentId,
      categoryId,
      teamIds,
      seriesName,
      seriesNumber,
      assignSchedule
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating fixtures:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate fixtures' },
      { status: 500 }
    );
  }
}
