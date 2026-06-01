import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ExamHeader from '@/components/exam-header';

function getBadge(container: HTMLElement): HTMLElement {
  const badge = container.querySelector('.tabular-nums');
  if (!badge) throw new Error('timer badge not found');
  return badge as HTMLElement;
}

describe('ExamHeader', () => {
  it('shows the title and initial time (90s per question)', () => {
    const { container } = render(
      <ExamHeader examTitle="Algebra Quiz" totalQuestions={2} onTimeUp={vi.fn()} />
    );
    expect(
      screen.getByRole('heading', { name: 'Algebra Quiz' })
    ).toBeInTheDocument();
    expect(getBadge(container)).toHaveTextContent('03:00'); // 2 * 90s = 180s
  });

  it('uses the destructive color under 5 minutes remaining', () => {
    const { container } = render(
      <ExamHeader examTitle="Quiz" totalQuestions={2} onTimeUp={vi.fn()} />
    );
    expect(getBadge(container).className).toContain('bg-destructive/80');
  });

  it('uses the primary color at or above 5 minutes remaining', () => {
    const { container } = render(
      <ExamHeader examTitle="Quiz" totalQuestions={4} onTimeUp={vi.fn()} />
    );
    // 4 * 90s = 360s >= 300s threshold
    expect(getBadge(container).className).toContain('bg-primary/80');
  });

  it('counts down one second per interval tick', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <ExamHeader examTitle="Quiz" totalQuestions={2} onTimeUp={vi.fn()} />
      );
      const badge = getBadge(container);
      expect(badge).toHaveTextContent('03:00');
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(badge).toHaveTextContent('02:59');
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onTimeUp when the timer starts at zero', () => {
    const onTimeUp = vi.fn();
    render(<ExamHeader examTitle="Quiz" totalQuestions={0} onTimeUp={onTimeUp} />);
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });
});
