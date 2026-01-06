import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Criando produtos e preços no Stripe...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Plano de assinatura Base',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // R$8 em centavos
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plano de assinatura Plus',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // R$12 em centavos
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Produtos e preços do Stripe criados com sucesso.');
}

async function seed() {
  const email = 'admin@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [adminUser] = await db
    .insert(users)
    .values([
      {
        email: email,
        name: 'Administrador',
        passwordHash: passwordHash,
        role: 'admin',
      },
    ])
    .returning();

  console.log('Usuário administrador criado.');

  // Criar usuários de exemplo para os outros papéis
  const alunoPassword = await hashPassword('aluno123');
  await db
    .insert(users)
    .values([
      {
        email: 'aluno@test.com',
        name: 'Aluno Teste',
        passwordHash: alunoPassword,
        role: 'aluno',
      },
    ]);

  console.log('Usuário aluno criado.');

  const professorPassword = await hashPassword('professor123');
  await db
    .insert(users)
    .values([
      {
        email: 'professor@test.com',
        name: 'Professor Teste',
        passwordHash: professorPassword,
        role: 'professor',
      },
    ]);

  console.log('Usuário professor criado.');

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Processo de seed falhou:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Processo de seed finalizado. Saindo...');
    process.exit(0);
  });
