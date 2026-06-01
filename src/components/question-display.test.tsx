import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Question } from '@/ai/flows/generate-exam-questions';
import QuestionDisplay from '@/components/question-display';

const mcQuestion: Question = {
  id: 1,
  type: 'multiple-choice',
  text: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  answer: '4',
};

const textQuestion: Question = {
  id: 2,
  type: 'text',
  text: 'Explain the theory of relativity.',
  answer: 'A model answer.',
};

describe('QuestionDisplay', () => {
  it('renders the question text', () => {
    render(<QuestionDisplay question={mcQuestion} onAnswerChange={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'What is 2 + 2?' })
    ).toBeInTheDocument();
  });

  it('renders one radio per option for multiple-choice questions', () => {
    render(<QuestionDisplay question={mcQuestion} onAnswerChange={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(mcQuestion.options!.length);
    for (const option of mcQuestion.options!) {
      expect(screen.getByText(option)).toBeInTheDocument();
    }
  });

  it('reports the selected option value when a radio is clicked', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();
    render(
      <QuestionDisplay question={mcQuestion} onAnswerChange={onAnswerChange} />
    );
    await user.click(screen.getAllByRole('radio')[1]);
    expect(onAnswerChange).toHaveBeenCalledWith('4');
  });

  it('renders a textarea for text questions and reports typed input', () => {
    const onAnswerChange = vi.fn();
    render(
      <QuestionDisplay question={textQuestion} onAnswerChange={onAnswerChange} />
    );
    const textarea = screen.getByPlaceholderText('Type your answer here...');
    expect(textarea).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'My written answer' } });
    expect(onAnswerChange).toHaveBeenCalledWith('My written answer');
  });
});
