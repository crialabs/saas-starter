'use server';

import { redirect } from 'next/navigation';
import { createMercadoPagoPreference } from './mercadopago';
import { withTeam } from '@/lib/auth/middleware';

export const mercadopagoCheckoutAction = withTeam(async (formData, team) => {
  const planId = formData.get('planId') as string;
  const preference = await createMercadoPagoPreference({ team, planId });
  
  if (preference.init_point) {
    redirect(preference.init_point);
  } else {
    throw new Error('Failed to create Mercado Pago preference');
  }
});
