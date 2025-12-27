/**
 * Root Layout
 * @spec FEAT-001
 */

import type { Metadata } from 'next';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
