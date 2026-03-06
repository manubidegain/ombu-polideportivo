import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { to, userName, courtName, date, startTime, duration, price } = body;

    // Validate required fields
    if (!to || !userName || !courtName || !date || !startTime || !duration || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendBookingConfirmation({
      to,
      userName,
      courtName,
      date,
      startTime,
      duration,
      price,
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-confirmation API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
