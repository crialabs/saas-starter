import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMercadoPagoPayment } from '@/lib/payments/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mercado Pago sends notifications for different events
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        return NextResponse.json({ error: 'ID de pagamento ausente' }, { status: 400 });
      }

      // Get payment details
      const payment = await getMercadoPagoPayment(paymentId);
      
      if (!payment.external_reference) {
        console.log('Pagamento não possui referência externa, ignorando');
        return NextResponse.json({ received: true });
      }

      // Parse external reference: userId:planId
      const parts = payment.external_reference.split(':');
      if (parts.length !== 2) {
        console.error('Formato de referência externa inválido, esperado userId:planId');
        return NextResponse.json({ error: 'Referência inválida' }, { status: 400 });
      }
      
      const [userIdStr] = parts;
      const userId = Number(userIdStr);

      if (isNaN(userId)) {
        console.error('ID de usuário inválido na referência externa');
        return NextResponse.json({ error: 'Referência inválida' }, { status: 400 });
      }

      // Update user subscription status based on payment status
      if (payment.status === 'approved') {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else if (payment.status === 'refunded') {
        await db
          .update(users)
          .set({
            subscriptionStatus: 'cancelled',
            mercadopagoSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      return NextResponse.json({ received: true });
    }

    // Handle other notification types if needed
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json({ error: 'Processamento de webhook falhou' }, { status: 500 });
  }
}
