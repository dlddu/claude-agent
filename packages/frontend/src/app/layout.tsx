/**
 * Root Layout
 * @spec FEAT-001
 * @spec UI-004
 */

import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Claude Agent Service',
  description: 'Kubernetes-based Claude Agent execution platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
