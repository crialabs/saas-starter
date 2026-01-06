'use server';

import { redirect } from 'next/navigation';
import { createMercadoPagoPreference } from './mercadopago';
import { withUser } from '@/lib/auth/middleware';

export const mercadopagoCheckoutAction = withUser(async (formData, user) => {
  const planId = formData.get('planId') as string;
  const preference = await createMercadoPagoPreference({ user, planId });
  
  if (preference.init_point) {
    redirect(preference.init_point);
  } else {
    throw new Error('Falha ao criar preferência do Mercado Pago');
  }
});
