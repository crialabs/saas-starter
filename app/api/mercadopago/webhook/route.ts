import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMercadoPagoPayment } from '@/lib/payments/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mercado Pago sends notifications for different events
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
      }

      // Get payment details
      const payment = await getMercadoPagoPayment(paymentId);
      
      if (!payment.external_reference) {
        console.log('Payment has no external reference, skipping');
        return NextResponse.json({ received: true });
      }

      // Parse external reference: teamId:userId:planId
      const [teamIdStr] = payment.external_reference.split(':');
      const teamId = Number(teamIdStr);

      if (isNaN(teamId)) {
        console.error('Invalid team ID in external reference');
        return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
      }

      // Update team subscription status based on payment status
      if (payment.status === 'approved') {
        await db
          .update(teams)
          .set({
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await db
          .update(teams)
          .set({
            subscriptionStatus: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      } else if (payment.status === 'refunded') {
        await db
          .update(teams)
          .set({
            subscriptionStatus: 'cancelled',
            mercadopagoSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId));
      }

      return NextResponse.json({ received: true });
    }

    // Handle other notification types if needed
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
