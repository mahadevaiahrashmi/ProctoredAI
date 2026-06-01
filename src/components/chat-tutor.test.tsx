import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatTutor from '@/components/chat-tutor';

const clarifyDoubtAction = vi.fn(async (_input: unknown) => 'Here is the explanation.');
const textToSpeechAction = vi.fn(async (_text: string) => 'data:audio/wav;base64,AAAA');
const getProviderCapabilitiesAction = vi.fn(async () => ({
  provider: 'googleai',
  vision: true,
  tts: true,
}));

vi.mock('@/app/actions', () => ({
  clarifyDoubtAction: (input: unknown) => clarifyDoubtAction(input),
  textToSpeechAction: (text: string) => textToSpeechAction(text),
  getProviderCapabilitiesAction: () => getProviderCapabilitiesAction(),
}));

const examContext = {
  examTitle: 'Sample Exam',
  questions: [{ id: 1, type: 'text' as const, text: 'Q1', answer: 'a' }],
  userAnswers: { 1: 'a' },
  gradingReport: {
    overallScore: 80,
    summaryReport: 'Solid.',
    gradedQuestions: [{ questionId: 1, isCorrect: true, feedback: 'Good.' }],
  },
};

beforeEach(() => {
  // jsdom doesn't implement media playback; stub so play()/pause() are safe.
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function ask(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/explain why/i), 'Why q1?');
  await user.click(screen.getByRole('button', { name: /^send$/i }));
}

describe('ChatTutor voice opt-out', () => {
  it('speaks the answer by default (voice on)', async () => {
    const user = userEvent.setup();
    render(<ChatTutor examContext={examContext} />);

    // Capability check resolves -> the voice control appears.
    expect(
      await screen.findByRole('button', { name: /mute spoken answers/i })
    ).toBeInTheDocument();

    await ask(user);

    await waitFor(() => expect(clarifyDoubtAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(textToSpeechAction).toHaveBeenCalledTimes(1));
  });

  it('does not speak after the user mutes the tutor', async () => {
    const user = userEvent.setup();
    render(<ChatTutor examContext={examContext} />);

    const muteBtn = await screen.findByRole('button', {
      name: /mute spoken answers/i,
    });
    await user.click(muteBtn);
    // Label flips, confirming the muted state.
    expect(
      await screen.findByRole('button', { name: /unmute spoken answers/i })
    ).toBeInTheDocument();

    await ask(user);

    await waitFor(() => expect(clarifyDoubtAction).toHaveBeenCalledTimes(1));
    expect(textToSpeechAction).not.toHaveBeenCalled();
  });

  it('hides the voice control entirely when the provider has no TTS', async () => {
    getProviderCapabilitiesAction.mockResolvedValueOnce({
      provider: 'ollama',
      vision: false,
      tts: false,
    });
    const user = userEvent.setup();
    render(<ChatTutor examContext={examContext} />);

    // Wait for the capability check to remove the (optimistically shown) control.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /spoken answers/i })
      ).toBeNull()
    );

    await ask(user);

    await waitFor(() => expect(clarifyDoubtAction).toHaveBeenCalledTimes(1));
    expect(textToSpeechAction).not.toHaveBeenCalled();
  });
});
