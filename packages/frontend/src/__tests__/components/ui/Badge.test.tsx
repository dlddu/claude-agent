/**
 * Badge Component Tests
 * @spec UI-004
 */

import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-primary');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('text-foreground');
  });

  it('applies status variant classes', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-500');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-500');

    rerender(<Badge variant="pending">Pending</Badge>);
    expect(screen.getByText('Pending')).toHaveClass('bg-gray-400');

    rerender(<Badge variant="running">Running</Badge>);
    expect(screen.getByText('Running')).toHaveClass('bg-blue-500');

    rerender(<Badge variant="completed">Completed</Badge>);
    expect(screen.getByText('Completed')).toHaveClass('bg-green-500');

    rerender(<Badge variant="failed">Failed</Badge>);
    expect(screen.getByText('Failed')).toHaveClass('bg-red-500');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});
