import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExamPage from '@/app/exam/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Stub the proctoring sub-components: ProctoringPanel opens the webcam and runs
// a polling loop, FloatingCamera also grabs the camera, and QuestionDisplay
// needs a fully-shaped question. None of that is relevant to the proctored vs.
// unproctored branching under test.
vi.mock('@/components/proctoring-panel', () => ({
  default: () => <div data-testid="proctoring-panel" />,
}));
vi.mock('@/components/floating-camera', () => ({
  default: () => <div data-testid="floating-camera" />,
}));
vi.mock('@/components/question-display', () => ({
  default: () => <div data-testid="question" />,
}));

const EXAM_DATA = {
  title: 'Sample Exam',
  questions: [
    { id: 1, text: 'Q1', type: 'multiple-choice', options: ['a', 'b'], answer: 'a' },
    { id: 2, text: 'Q2', type: 'multiple-choice', options: ['a', 'b'], answer: 'b' },
  ],
};

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('examData', JSON.stringify(EXAM_DATA));
});

afterEach(() => {
  sessionStorage.clear();
});

describe('ExamPage proctoring mode', () => {
  it('hides proctoring UI and shows an unproctored notice when proctored is false', async () => {
    sessionStorage.setItem('examConfig', JSON.stringify({ proctored: false }));
    render(<ExamPage />);

    // Rendered in both the mobile banner and the desktop aside (jsdom ignores
    // the responsive CSS that hides one), so expect one or more matches.
    expect((await screen.findAllByText(/Unproctored Session/i)).length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId('proctoring-panel')).toHaveLength(0);
    expect(screen.queryByTestId('floating-camera')).toBeNull();
  });

  it('renders the proctoring panel when proctored is true', async () => {
    sessionStorage.setItem('examConfig', JSON.stringify({ proctored: true }));
    render(<ExamPage />);

    // Wait for the exam content (post-effect render) before asserting.
    expect(await screen.findByTestId('question')).toBeInTheDocument();
    expect(screen.queryAllByTestId('proctoring-panel').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Unproctored Session/i)).toBeNull();
  });

  it('defaults to proctored when no examConfig is present', async () => {
    render(<ExamPage />);
    expect(await screen.findByTestId('question')).toBeInTheDocument();
    expect(screen.queryAllByTestId('proctoring-panel').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Unproctored Session/i)).toBeNull();
  });
});
