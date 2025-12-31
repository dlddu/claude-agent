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

  it('renders RUNNING status with animation', () => {
    render(<ExecutionStatus status="RUNNING" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
    const badge = screen.getByText('Running').closest('span');
    expect(badge?.querySelector('svg')).toHaveClass('animate-spin');
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

  it('applies size classes correctly', () => {
    const { rerender } = render(<ExecutionStatus status="COMPLETED" size="sm" />);
    const smallBadge = screen.getByText('Completed').closest('span');
    expect(smallBadge).toHaveClass('text-xs');

    rerender(<ExecutionStatus status="COMPLETED" size="lg" />);
    const largeBadge = screen.getByText('Completed').closest('span');
    expect(largeBadge).toHaveClass('text-base');
  });

  it('accepts custom className', () => {
    render(<ExecutionStatus status="COMPLETED" className="custom-class" />);
    const badge = screen.getByText('Completed').closest('span');
    expect(badge).toHaveClass('custom-class');
  });
});
