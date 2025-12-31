/**
 * ExecutionForm Component Tests
 * @spec UI-001
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: 'test-id' });

    renderWithProviders(<ExecutionForm />);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    await user.type(promptInput, 'Test prompt');

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
    const user = userEvent.setup();
    renderWithProviders(<ExecutionForm />);

    // Advanced options should be hidden initially
    expect(screen.queryByText('Callback URL')).not.toBeInTheDocument();

    // Click to expand
    const advancedHeader = screen.getByText('Advanced Options');
    await user.click(advancedHeader);

    // Advanced options should now be visible
    expect(screen.getByText('Callback URL')).toBeInTheDocument();
    expect(screen.getByText('Resource Configuration')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('adds and removes metadata fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExecutionForm />);

    // Expand advanced options
    await user.click(screen.getByText('Advanced Options'));

    // Add metadata
    const addButton = screen.getByText('Add');
    await user.click(addButton);

    // Metadata inputs should appear
    expect(screen.getByPlaceholderText('Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Value')).toBeInTheDocument();

    // Remove metadata
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(
      (btn) => btn.querySelector('svg.text-red-500')
    );
    if (deleteButton) {
      await user.click(deleteButton);
    }

    // Metadata inputs should be removed
    expect(screen.queryByPlaceholderText('Key')).not.toBeInTheDocument();
  });

  it('navigates back when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExecutionForm />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('redirects to execution detail on successful creation', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({ id: 'new-execution-id' });

    renderWithProviders(<ExecutionForm />);

    const promptInput = screen.getByPlaceholderText('Enter your prompt here...');
    await user.type(promptInput, 'Test prompt');

    const submitButton = screen.getByText('Create Execution');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/executions/new-execution-id');
    });
  });
});
