import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment, mercadoPagoPlans } from '@/lib/payments/mercadopago';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  if (status === 'failure' || status === 'pending') {
    return NextResponse.redirect(new URL('/pricing?error=payment_failed', request.url));
  }

  if (!paymentId || !externalReference) {
    return NextResponse.redirect(new URL('/pricing?error=missing_params', request.url));
  }

  try {
    // Get payment details from Mercado Pago
    const payment = await getMercadoPagoPayment(paymentId);

    if (payment.status !== 'approved') {
      return NextResponse.redirect(new URL('/pricing?error=payment_not_approved', request.url));
    }

    // Parse external reference: teamId:userId:planId
    const parts = externalReference.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid external reference format, expected teamId:userId:planId');
    }
    
    const [teamIdStr, userIdStr, planId] = parts;
    const teamId = Number(teamIdStr);
    const userId = Number(userIdStr);

    if (isNaN(teamId) || isNaN(userId)) {
      throw new Error('Invalid external reference format');
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found in database.');
    }

    const userTeam = await db
      .select({
        teamId: teamMembers.teamId,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user[0].id))
      .limit(1);

    if (userTeam.length === 0) {
      throw new Error('User is not associated with any team.');
    }

    // Find the plan details
    const plan = mercadoPagoPlans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Update team with Mercado Pago details
    await db
      .update(teams)
      .set({
        mercadopagoCustomerId: payment.payer?.id?.toString() || null,
        mercadopagoSubscriptionId: paymentId,
        mercadopagoPreapprovalPlanId: planId,
        planName: plan.title,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(teams.id, userTeam[0].teamId));

    await setSession(user[0]);
    return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
  } catch (error) {
    console.error('Error handling Mercado Pago checkout:', error);
    return NextResponse.redirect(new URL('/pricing?error=processing_failed', request.url));
  }
}
