/**
 * Home Page - Redirects to Dashboard
 * @spec FEAT-001
 * @spec UI-004
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
