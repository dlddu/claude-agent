/**
 * Toast Notification Context
 * @spec UI-004
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { generateId } from '@/lib/utils';

/**
 * Toast type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast interface
 */
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast options
 */
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast Context interface
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  warning: (title: string, options?: ToastOptions) => string;
  info: (title: string, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000;

/**
 * Toast Provider Props
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Add a toast
   */
  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATION,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  /**
   * Remove a toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Success toast
   */
  const success = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addToast({ type: 'success', title, ...options });
    },
    [addToast]
  );

  /**
   * Error toast
   */
  const error = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addToast({ type: 'error', title, ...options });
    },
    [addToast]
  );

  /**
   * Warning toast
   */
  const warning = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addToast({ type: 'warning', title, ...options });
    },
    [addToast]
  );

  /**
   * Info toast
   */
  const info = useCallback(
    (title: string, options?: ToastOptions): string => {
      return addToast({ type: 'info', title, ...options });
    },
    [addToast]
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * useToast hook
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
