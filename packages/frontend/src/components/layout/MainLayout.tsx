/**
 * Main Layout Component
 * @spec UI-004
 */

'use client';

import { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showBreadcrumb?: boolean;
}

export function MainLayout({ children, className, showBreadcrumb = true }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main
          className={cn(
            'flex-1 transition-all duration-300',
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-64',
            className
          )}
        >
          {showBreadcrumb && (
            <div className="border-b border-border px-4 py-2 md:px-6">
              <Breadcrumb />
            </div>
          )}
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
