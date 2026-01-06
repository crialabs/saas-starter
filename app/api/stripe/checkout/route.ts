import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Dados de cliente inválidos do Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('Nenhuma assinatura encontrada para esta sessão.');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error('Nenhum plano encontrado para esta assinatura.');
    }

    const productId = (plan.product as Stripe.Product).id;

    if (!productId) {
      throw new Error('Nenhum ID de produto encontrado para esta assinatura.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("Nenhum ID de usuário encontrado no client_reference_id da sessão.");
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (user.length === 0) {
      throw new Error('Usuário não encontrado no banco de dados.');
    }

    await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeProductId: productId,
        planName: (plan.product as Stripe.Product).name,
        subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user[0].id));

    await setSession(user[0]);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Erro ao processar checkout bem-sucedido:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
