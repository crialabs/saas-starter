import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { redirect } from 'next/navigation';
import { User } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

// Initialize Mercado Pago client
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN environment variable is required');
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
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
    title: 'Plano Base',
    price: 8.00,
    currency_id: 'BRL'
  },
  {
    id: 'plus-plan',
    title: 'Plano Plus',
    price: 12.00,
    currency_id: 'BRL'
  }
];

export async function createMercadoPagoPreference({
  user,
  planId
}: {
  user: User | null;
  planId: string;
}) {
  if (!user) {
    redirect(`/sign-up?redirect=checkout&planId=${planId}`);
  }

  const plan = mercadoPagoPlans.find(p => p.id === planId);
  
  if (!plan) {
    throw new Error('ID do plano inválido');
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
        external_reference: `${user.id}:${planId}`,
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
    console.error('Erro ao criar preferência do Mercado Pago:', error);
    throw error;
  }
}

export async function getMercadoPagoPayment(paymentId: string) {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  } catch (error) {
    console.error('Erro ao buscar pagamento do Mercado Pago:', error);
    throw error;
  }
}

export function getMercadoPagoPublicKey() {
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.error('Variável de ambiente MERCADOPAGO_PUBLIC_KEY não está configurada');
    throw new Error('Chave pública do Mercado Pago não está configurada');
  }
  return publicKey;
}
