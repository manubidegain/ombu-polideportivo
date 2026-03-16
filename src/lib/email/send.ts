import { Resend } from 'resend';
import { getBookingConfirmationHTML } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendBookingConfirmationParams {
  to: string;
  userName: string;
  courtName: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  try {
    const html = getBookingConfirmationHTML({
      userName: params.userName,
      userEmail: params.to,
      courtName: params.courtName,
      date: params.date,
      startTime: params.startTime,
      duration: params.duration,
      price: params.price,
    });

    const { data, error } = await resend.emails.send({
      from: 'Polideportivo Ombú <info@ombustudio.com>',
      to: params.to,
      subject: `Reserva Confirmada - ${params.courtName}`,
      html: html,
      replyTo: 'polideportivocentrounion@gmail.com',
    });

    if (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    throw error;
  }
}
