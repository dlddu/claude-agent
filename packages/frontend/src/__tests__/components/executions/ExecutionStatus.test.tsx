/**
 * ExecutionStatus Component Tests
 * @spec UI-001
 */

import { render, screen } from '@testing-library/react';
import { ExecutionStatus } from '@/components/executions/ExecutionStatus';

describe('ExecutionStatus', () => {
  it('renders PENDING status correctly', () => {
    render(<ExecutionStatus status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders RUNNING status correctly', () => {
    render(<ExecutionStatus status="RUNNING" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders COMPLETED status correctly', () => {
    render(<ExecutionStatus status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders FAILED status correctly', () => {
    render(<ExecutionStatus status="FAILED" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders CANCELLED status correctly', () => {
    render(<ExecutionStatus status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ExecutionStatus status="COMPLETED" showLabel={false} />);
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('renders all status types without error', () => {
    const statuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

    statuses.forEach((status) => {
      const { unmount } = render(<ExecutionStatus status={status} />);
      unmount();
    });
  });
});
