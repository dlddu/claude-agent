/**
 * AuthGuard Component Tests
 * @spec UI-004
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard, GuestGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the auth context with different states
jest.mock('@/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('@/contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn(),
  };
});

import { useAuth } from '@/contexts/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('does not render children when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('GuestGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    expect(screen.queryByText('Guest Content')).not.toBeInTheDocument();
  });

  it('renders children when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Guest Content')).toBeInTheDocument();
    });
  });

  it('does not render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <GuestGuard>
        <div>Guest Content</div>
      </GuestGuard>
    );

    expect(screen.queryByText('Guest Content')).not.toBeInTheDocument();
  });
});
