/**
 * Breadcrumb Component
 * @spec UI-004
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  executions: 'Executions',
  new: 'New',
  history: 'History',
  artifacts: 'Artifacts',
  statistics: 'Statistics',
  settings: 'Settings',
};

export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = pathNameMap[segment] || segment;
    return { label, href };
  });

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)} aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === breadcrumbs.length - 1 ? (
            <span className="ml-1 font-medium text-foreground">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
