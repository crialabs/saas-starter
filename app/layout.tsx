import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'Sistema de Gestão Educacional',
  description: 'Plataforma completa para gestão educacional com Next.js, Postgres e pagamentos integrados.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <head>
        {/* Mercado Pago SDK - carregado do CDN para atualizações automáticas
            Nota: Para produção, considere hospedar localmente ou fixar em uma versão específica com SRI */}
        <script src="https://sdk.mercadopago.com/js/v2" async></script>
      </head>
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser()
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
