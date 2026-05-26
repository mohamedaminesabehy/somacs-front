import { render, screen } from '@testing-library/react';
import { StatusBadge, PriorityBadge } from './DevisSuiviBadges';
import { REMINDER_PRIORITY } from '../../constants/devisSuiviConstants';

describe('DevisSuiviBadges', () => {
  describe('StatusBadge', () => {
    it('should render status badge with correct text', () => {
      render(<StatusBadge value="CREATED" />);
      const badge = screen.getByText('Créé');
      expect(badge).toBeInTheDocument();
    });

    it('should render default status (CREATED) when invalid value provided', () => {
      render(<StatusBadge value="INVALID_STATUS" />);
      const badge = screen.getByText('Créé');
      expect(badge).toBeInTheDocument();
    });

    it('should display HOT_LEAD with emoji', () => {
      render(<StatusBadge value="HOT_LEAD" />);
      const badge = screen.getByText('Hot Lead 🔥');
      expect(badge).toBeInTheDocument();
    });

    it('should have correct CSS classes for styling', () => {
      const { container } = render(<StatusBadge value="PURCHASED" />);
      const span = container.querySelector('span');
      expect(span).toHaveClass('inline-flex', 'items-center', 'gap-1.5', 'rounded-full', 'border');
    });

    it('should contain a dot indicator', () => {
      const { container } = render(<StatusBadge value="NEGOTIATION" />);
      const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('PriorityBadge', () => {
    it('should render priority badge when value is provided', () => {
      render(<PriorityBadge value={REMINDER_PRIORITY.URGENT} />);
      const badge = screen.getByText('Urgent');
      expect(badge).toBeInTheDocument();
    });

    it('should return null when value is null', () => {
      const { container } = render(<PriorityBadge value={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when value is undefined', () => {
      const { container } = render(<PriorityBadge value={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null for invalid priority', () => {
      const { container } = render(<PriorityBadge value="INVALID_PRIORITY" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render all priority levels correctly', () => {
      Object.values(REMINDER_PRIORITY).forEach((priority) => {
        const { unmount } = render(<PriorityBadge value={priority} />);
        expect(screen.getByText(/Faible|Moyen|Élevé|Urgent/)).toBeInTheDocument();
        unmount();
      });
    });

    it('should have correct CSS classes', () => {
      const { container } = render(<PriorityBadge value={REMINDER_PRIORITY.HIGH} />);
      const span = container.querySelector('span');
      expect(span).toHaveClass('inline-flex', 'items-center', 'gap-1', 'rounded-full', 'border');
    });

    it('should display dot with correct color for each priority', () => {
      const { container } = render(<PriorityBadge value={REMINDER_PRIORITY.URGENT} />);
      const dot = container.querySelector('.bg-rose-500');
      expect(dot).toBeInTheDocument();
    });
  });
});
