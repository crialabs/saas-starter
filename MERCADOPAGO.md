# Mercado Pago Integration

This project now includes integration with Mercado Pago, a popular payment gateway in Latin America, alongside the existing Stripe integration.

## Features

- **Dual Payment Options**: Users can choose between Stripe or Mercado Pago for payments
- **Mercado Pago Checkout Pro**: Integration using the official Mercado Pago SDK
- **Webhook Support**: Handles payment notifications from Mercado Pago
- **Database Support**: Stores Mercado Pago customer and subscription data

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key
```

To get these credentials:
1. Create an account at [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Go to your application settings
3. Copy your test credentials (for development) or production credentials

### Database Migration

Run the database migration to add Mercado Pago fields to the teams table:

```bash
pnpm db:migrate
```

This will add the following columns:
- `mercadopago_customer_id`
- `mercadopago_subscription_id`
- `mercadopago_preapproval_plan_id`

## How It Works

### Payment Flow

1. User visits the `/pricing` page
2. Two payment options are displayed for each plan:
   - "Get Started" button (Stripe)
   - "Pay with Mercado Pago" button (Mercado Pago)
3. When user selects Mercado Pago:
   - A payment preference is created via `lib/payments/mercadopago.ts`
   - User is redirected to Mercado Pago's checkout page
   - After payment, user is redirected back to `/api/mercadopago/checkout`
   - Team subscription is updated in the database

### Webhook Configuration

To receive payment notifications in development:

1. Use a tunneling service like ngrok: `ngrok http 3000`
2. Configure webhook in Mercado Pago dashboard:
   - URL: `https://your-domain.ngrok.io/api/mercadopago/webhook`
   - Events: payment

In production:
- Set webhook URL to: `https://yourdomain.com/api/mercadopago/webhook`

## Plan Configuration

Plans are configured in `lib/payments/mercadopago.ts`:

```typescript
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
```

Adjust the prices and currency as needed for your region.

## Testing

Use Mercado Pago's test cards:
- **Approved**: 5031 7557 3453 0604
- **Rejected**: 5031 4332 1540 6351
- CVV: Any 3 digits
- Expiration: Any future date

## Files Added/Modified

### New Files
- `lib/payments/mercadopago.ts` - Core Mercado Pago integration
- `lib/payments/mercadopago-actions.ts` - Server actions for checkout
- `app/api/mercadopago/checkout/route.ts` - Checkout callback handler
- `app/api/mercadopago/webhook/route.ts` - Webhook handler
- `lib/db/migrations/0001_lean_hairball.sql` - Database migration

### Modified Files
- `app/(dashboard)/pricing/page.tsx` - Added Mercado Pago payment button
- `app/layout.tsx` - Added Mercado Pago SDK script
- `lib/db/schema.ts` - Added Mercado Pago fields to teams table
- `.env.example` - Added Mercado Pago environment variables
- `package.json` - Added mercadopago dependency

## API Reference

### Mercado Pago SDK

The integration uses the official Mercado Pago Node.js SDK:
- Package: `mercadopago`
- Version: `^2.11.0`
- Documentation: https://github.com/mercadopago/sdk-nodejs

### Frontend SDK

The Mercado Pago JavaScript SDK is loaded in the root layout:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

This enables future frontend integrations like custom checkout forms or payment bricks.

## Support

For Mercado Pago specific issues, refer to:
- [Official Documentation](https://www.mercadopago.com.br/developers/en/docs)
- [Checkout Pro Guide](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/landing)
