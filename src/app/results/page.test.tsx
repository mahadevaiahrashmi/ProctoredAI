import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsPage from '@/app/results/page';

// Stub server actions so grading resolves synchronously without a model, and
// stub the tutor + Link (which need app-router context we don't set up here).
vi.mock('@/app/actions', () => ({
  gradeExamAction: vi.fn(async () => ({
    overallScore: 80,
    summaryReport: 'Solid performance.',
    gradedQuestions: [{ questionId: 1, isCorrect: true, feedback: 'Correct.' }],
  })),
  summarizeAlertsAction: vi.fn(async (alerts: string[]) =>
    alerts.length > 0
      ? 'One or more violations were detected.'
      : 'No proctoring violations were detected during the exam session.'
  ),
}));
vi.mock('@/components/chat-tutor', () => ({
  default: () => <div data-testid="chat-tutor" />,
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const QUESTIONS = [{ id: 1, text: 'Q1', answer: 'a' }];

function seedResults(overrides: Record<string, unknown>) {
  sessionStorage.setItem(
    'examResults',
    JSON.stringify({
      questions: QUESTIONS,
      answers: { 1: 'a' },
      violations: [],
      title: 'Sample Exam',
      ...overrides,
    })
  );
}

beforeEach(() => {
  sessionStorage.clear();
});
afterEach(() => {
  sessionStorage.clear();
});

describe('ResultsPage proctoring labeling', () => {
  it('labels an unproctored session and omits the violation report', async () => {
    seedResults({ proctored: false });
    render(<ResultsPage />);

    expect(await screen.findByText(/Exam Report for/i)).toBeInTheDocument();
    // Appears as both the header badge and the dedicated summary card title.
    expect(screen.getAllByText(/Unproctored Session/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/no integrity monitoring was performed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Proctoring Violation Report/i)).toBeNull();
  });

  it('shows the violation report for a proctored session with violations', async () => {
    seedResults({ proctored: true, violations: ['10:00:00: Phone detected.'] });
    render(<ResultsPage />);

    expect(await screen.findByText(/Exam Report for/i)).toBeInTheDocument();
    expect(screen.getByText(/Proctoring Violation Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone detected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unproctored session/i)).toBeNull();
  });

  it('treats a legacy result with no proctored flag as proctored', async () => {
    seedResults({ violations: [] });
    render(<ResultsPage />);

    expect(await screen.findByText(/Exam Report for/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unproctored session/i)).toBeNull();
  });
});
