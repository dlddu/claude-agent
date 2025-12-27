/**
 * Header Component
 * @spec UI-004
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserMenu } from '@/components/auth/UserMenu';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6',
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          CA
        </div>
        <span className="hidden md:inline-block">Claude Agent</span>
      </Link>

      {/* Search bar */}
      <div className="flex-1 flex justify-center">
        {showSearch ? (
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
                onBlur={() => setShowSearch(false)}
                autoFocus
              />
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
            className="hidden md:flex"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
