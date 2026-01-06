import { checkoutAction } from '@/lib/payments/actions';
import { mercadopagoCheckoutAction } from '@/lib/payments/mercadopago-actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { mercadoPagoPlans } from '@/lib/payments/mercadopago';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Escolha seu Plano</h1>
      <p className="text-center text-gray-600 mb-12">Selecione o plano ideal para suas necessidades</p>
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name="Base"
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Uso Ilimitado',
            'Membros Ilimitados',
            'Suporte por Email',
          ]}
          priceId={basePrice?.id}
          mercadopagoPlanId="base-plan"
        />
        <PricingCard
          name="Plus"
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Tudo do Base, e mais:',
            'Acesso Antecipado a Novos Recursos',
            'Suporte 24/7 + Acesso ao Slack',
          ]}
          priceId={plusPrice?.id}
          mercadopagoPlanId="plus-plan"
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  mercadopagoPlanId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  mercadopagoPlanId?: string;
}) {
  const intervalText = interval === 'month' ? 'mês' : 'ano';
  
  return (
    <div className="pt-6 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        com {trialDays} dias de teste grátis
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        R${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          por usuário / {intervalText}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-3">
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton />
        </form>
        {mercadopagoPlanId && (
          <form action={mercadopagoCheckoutAction}>
            <input type="hidden" name="planId" value={mercadopagoPlanId} />
            <button
              type="submit"
              className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center"
            >
              Pagar com Mercado Pago
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
