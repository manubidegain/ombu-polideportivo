import { NextRequest, NextResponse } from 'next/server';
import { checkMatchAchievements } from '@/lib/tournaments/achievements';

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    // Check and award match-related achievements
    await checkMatchAchievements(matchId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error checking match achievements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check achievements' },
      { status: 500 }
    );
  }
}
