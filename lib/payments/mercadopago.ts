import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

export interface MercadoPagoPlan {
  id: string;
  title: string;
  price: number;
  currency_id: string;
}

// Define available plans for Mercado Pago
export const mercadoPagoPlans: MercadoPagoPlan[] = [
  {
    id: 'base-plan',
    title: 'Base Plan',
    price: 8.00,
    currency_id: 'BRL'
  },
  {
    id: 'plus-plan',
    title: 'Plus Plan',
    price: 12.00,
    currency_id: 'BRL'
  }
];

export async function createMercadoPagoPreference({
  team,
  planId
}: {
  team: Team | null;
  planId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&planId=${planId}`);
  }

  const plan = mercadoPagoPlans.find(p => p.id === planId);
  
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  try {
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: plan.currency_id
          }
        ],
        back_urls: {
          success: `${process.env.BASE_URL}/api/mercadopago/checkout?status=success`,
          failure: `${process.env.BASE_URL}/api/mercadopago/checkout?status=failure`,
          pending: `${process.env.BASE_URL}/api/mercadopago/checkout?status=pending`
        },
        auto_return: 'approved',
        external_reference: `${team.id}:${user.id}:${planId}`,
        payer: {
          email: user.email,
          name: user.name || undefined
        },
        statement_descriptor: 'ACME SaaS',
        notification_url: `${process.env.BASE_URL}/api/mercadopago/webhook`
      }
    });

    return preference;
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    throw error;
  }
}

export async function getMercadoPagoPayment(paymentId: string) {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  } catch (error) {
    console.error('Error fetching Mercado Pago payment:', error);
    throw error;
  }
}

export function getMercadoPagoPublicKey() {
  return process.env.MERCADOPAGO_PUBLIC_KEY || '';
}
