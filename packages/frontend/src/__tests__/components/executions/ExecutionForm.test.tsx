/**
 * ExecutionForm Component Tests
 * @spec UI-001 REQ-1
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExecutionForm } from '@/components/executions/ExecutionForm';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock the executionApi
const mockCreate = jest.fn();
jest.mock('@/services/executionApi', () => ({
  executionApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

// Test wrapper with QueryClientProvider
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
};

describe('ExecutionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required fields', () => {
      renderWithProviders(<ExecutionForm />);

      expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timeout/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create execution/i })).toBeInTheDocument();
    });

    it('has default values', () => {
      renderWithProviders(<ExecutionForm />);

      expect(screen.getByLabelText(/model/i)).toHaveValue('claude-sonnet-4-20250514');
      expect(screen.getByLabelText(/max tokens/i)).toHaveValue(4096);
      expect(screen.getByLabelText(/timeout/i)).toHaveValue(1800);
    });

    it('shows cancel button when onCancel is provided', () => {
      const onCancel = jest.fn();
      renderWithProviders(<ExecutionForm onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not show cancel button when onCancel is not provided', () => {
      renderWithProviders(<ExecutionForm />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when prompt is empty', async () => {
      renderWithProviders(<ExecutionForm />);

      const submitButton = screen.getByRole('button', { name: /create execution/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/prompt is required/i)).toBeInTheDocument();
      });
    });

    it('shows character count for prompt', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExecutionForm />);

      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Hello world');

      expect(screen.getByText(/11.*100,000 characters/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls create API with form data on submit', async () => {
      const user = userEvent.setup();
      mockCreate.mockResolvedValueOnce({ id: 'exec-123' });

      renderWithProviders(<ExecutionForm />);

      // Fill required fields
      const promptInput = screen.getByLabelText(/prompt/i);
      await user.type(promptInput, 'Test prompt for Claude agent');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create execution/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Test prompt for Claude agent',
            model: 'claude-sonnet-4-20250514',
            maxTokens: 4096,
            timeout: 1800,
          })
        );
      });
    });

    it('navigates to execution detail page on success', async () => {
      const user = userEvent.setup();
      mockCreate.mockResolvedValueOnce({ id: 'exec-123' });

      renderWithProviders(<ExecutionForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/prompt/i), 'Test prompt');
      fireEvent.click(screen.getByRole('button', { name: /create execution/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/executions/exec-123');
      });
    });

    it('calls onSuccess callback when provided', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockCreate.mockResolvedValueOnce({ id: 'exec-456' });

      renderWithProviders(<ExecutionForm onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/prompt/i), 'Test prompt');
      fireEvent.click(screen.getByRole('button', { name: /create execution/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('exec-456');
      });
    });

    it('shows error message when API call fails', async () => {
      const user = userEvent.setup();
      mockCreate.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<ExecutionForm />);

      await user.type(screen.getByLabelText(/prompt/i), 'Test prompt');
      fireEvent.click(screen.getByRole('button', { name: /create execution/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create execution/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Options', () => {
    it('toggles advanced options visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExecutionForm />);

      // Initially hidden
      expect(screen.queryByLabelText(/callback url/i)).not.toBeInTheDocument();

      // Click to expand
      const advancedToggle = screen.getByText(/advanced options/i);
      await user.click(advancedToggle);

      // Now visible
      expect(screen.getByLabelText(/callback url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/memory request/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cpu limit/i)).toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    it('allows adding metadata entries', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExecutionForm />);

      // Click add button
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Check for key/value inputs
      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      const valueInputs = screen.getAllByPlaceholderText(/value/i);

      expect(keyInputs).toHaveLength(1);
      expect(valueInputs).toHaveLength(1);
    });

    it('allows removing metadata entries', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExecutionForm />);

      // Add an entry
      await user.click(screen.getByRole('button', { name: /add/i }));

      // Should have key/value inputs
      expect(screen.getByPlaceholderText(/key/i)).toBeInTheDocument();

      // Find and click the delete button (it's the button with Trash2 icon)
      const allButtons = screen.getAllByRole('button');
      // The delete button is the one with size="icon" variant="ghost"
      const deleteButton = allButtons.find(btn =>
        btn.className.includes('h-10') && btn.className.includes('w-10')
      );
      expect(deleteButton).toBeDefined();
      await user.click(deleteButton!);

      // Should be gone
      expect(screen.queryByPlaceholderText(/key/i)).not.toBeInTheDocument();
    });

    it('includes metadata in submission', async () => {
      const user = userEvent.setup();
      mockCreate.mockResolvedValueOnce({ id: 'exec-789' });

      renderWithProviders(<ExecutionForm />);

      // Fill prompt
      await user.type(screen.getByLabelText(/prompt/i), 'Test prompt');

      // Add metadata
      await user.click(screen.getByRole('button', { name: /add/i }));
      const keyInput = screen.getByPlaceholderText(/key/i);
      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(keyInput, 'environment');
      await user.type(valueInput, 'production');

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create execution/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: { environment: 'production' },
          })
        );
      });
    });
  });

  describe('Cancel Action', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      renderWithProviders(<ExecutionForm onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
