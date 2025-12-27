/**
 * Avatar Component
 * @spec UI-004
 */

'use client';

import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const initials = fallback
      ? fallback
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    if (src) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative overflow-hidden rounded-full',
            sizeClasses[size],
            className
          )}
        >
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            {...props}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
