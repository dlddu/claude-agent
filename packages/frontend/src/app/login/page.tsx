/**
 * Login Page
 * @spec UI-004
 */

'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { GuestGuard } from '@/components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
              CA
            </div>
            <h1 className="mt-4 text-2xl font-bold">Claude Agent</h1>
            <p className="mt-1 text-muted-foreground">
              Kubernetes-based Agent Execution Platform
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </GuestGuard>
  );
}
