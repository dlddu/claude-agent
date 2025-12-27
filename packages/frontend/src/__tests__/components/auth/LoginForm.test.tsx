/**
 * LoginForm Component Tests
 * @spec UI-004
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Wrapper with required providers
const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <AuthProvider>
      <ToastProvider>{component}</ToastProvider>
    </AuthProvider>
  );
};

describe('LoginForm', () => {
  it('renders login form with email and password fields', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows email login mode by default', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('switches to API key mode when clicked', () => {
    renderWithProviders(<LoginForm />);

    const apiKeyTab = screen.getByRole('button', { name: /api key/i });
    fireEvent.click(apiKeyTab);

    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('accepts input values', () => {
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find and click the toggle button (eye icon)
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find((btn) =>
      btn.querySelector('svg')
    );

    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('has remember me checkbox', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('has forgot password link', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });
});
