/**
 * ExecutionForm Component Tests
 * @spec UI-001
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutionForm } from '@/components/executions/ExecutionForm';
import { ToastProvider } from '@/contexts/ToastContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock hooks
const mockCreate = jest.fn();
jest.mock('@/hooks/executions', () => ({
  useCreateExecution: () => ({
    create: mockCreate,
    isLoading: false,
  }),
}));

const renderWithProviders = (component: React.ReactNode) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe('ExecutionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    renderWithProviders(<ExecutionForm />);

    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Max Tokens')).toBeInTheDocument();
    expect(screen.getByText('Timeout (seconds)')).toBeInTheDocument();
    expect(screen.getByText('Create Execution')).toBeInTheDocument();
  });

  it('shows validation error when prompt is empty', async () => {
    renderWithProviders(<ExecutionForm />);

    const submitButton = screen.getByText('Create Execution');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Prompt is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockCreate.mockResolvedValue({ id: 'test-id' });

    renderWithProviders(<ExecutionForm />);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    const submitButton = screen.getByText('Create Execution');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
          model: 'claude-sonnet-4-20250514',
          maxTokens: 4096,
          timeout: 1800,
        })
      );
    });
  });

  it('toggles advanced options section', async () => {
    renderWithProviders(<ExecutionForm />);

    // Advanced options should be hidden initially
    expect(screen.queryByText('Callback URL')).not.toBeInTheDocument();

    // Click to expand
    const advancedHeader = screen.getByText('Advanced Options');
    fireEvent.click(advancedHeader);

    // Advanced options should now be visible
    await waitFor(() => {
      expect(screen.getByText('Callback URL')).toBeInTheDocument();
    });
  });

  it('navigates back when cancel is clicked', async () => {
    renderWithProviders(<ExecutionForm />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('redirects to execution detail on successful creation', async () => {
    mockCreate.mockResolvedValue({ id: 'new-execution-id' });

    renderWithProviders(<ExecutionForm />);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

    const submitButton = screen.getByText('Create Execution');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/executions/new-execution-id');
    });
  });
});
