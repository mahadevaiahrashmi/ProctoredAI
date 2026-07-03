import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExamInitiationPage from '@/app/page';

const router = { push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

const generateExamAction = vi.fn(async (_topic: string, _name: string) => ({
  examData: {
    title: 'Quantum Physics Quiz',
    questions: [{ id: 1, type: 'text', text: 'Q1', answer: 'a' }],
  },
  sessionPrompt: 'Please follow the exam rules.',
}));
const getProviderCapabilitiesAction = vi.fn(async () => ({
  provider: 'googleai',
  vision: true,
  tts: true,
}));
vi.mock('@/app/actions', () => ({
  generateExamAction: (topic: string, name: string) =>
    generateExamAction(topic, name),
  getProviderCapabilitiesAction: () => getProviderCapabilitiesAction(),
}));

beforeEach(() => {
  sessionStorage.clear();
  // requestPermissions() needs getUserMedia to resolve so both camera and mic
  // flip to "granted"; it also stops the probe stream, so provide a stop spy.
  const stream = {
    getTracks: () => [{ stop: vi.fn() } as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn(async () => stream) },
    configurable: true,
  });
});

afterEach(() => {
  sessionStorage.clear();
  delete (navigator as { mediaDevices?: unknown }).mediaDevices;
});

// Walk the setup wizard to the proctored "System Check" step where consent is
// captured: enter a name (topic is pre-filled), generate, then start the check.
async function reachSystemCheck(user: ReturnType<typeof userEvent.setup>) {
  render(<ExamInitiationPage />);
  await user.type(screen.getByLabelText(/your name/i), 'Alex');
  await user.click(screen.getByRole('button', { name: /generate exam/i }));
  await user.click(
    await screen.findByRole('button', { name: /start system check/i }),
  );
}

describe('ExamInitiationPage proctoring consent (TD-003)', () => {
  it('blocks the proctored start until consent is given, then records it', async () => {
    const user = userEvent.setup();
    await reachSystemCheck(user);

    // Permissions are granted (mock), but consent is still required: the button
    // is present, relabeled, and disabled.
    const blocked = await screen.findByRole('button', {
      name: /consent required to proctor/i,
    });
    expect(blocked).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));

    const start = await screen.findByRole('button', {
      name: /^start proctored exam$/i,
    });
    expect(start).toBeEnabled();
    await user.click(start);

    const config = JSON.parse(sessionStorage.getItem('examConfig')!);
    expect(config.proctored).toBe(true);
    expect(config.consent.noticeVersion).toBe('v1');
    expect(Number.isNaN(Date.parse(config.consent.acceptedAt))).toBe(false);
    expect(router.push).toHaveBeenCalledWith('/exam');
  });

  it('records an unproctored session with no consent when the camera is declined', async () => {
    const user = userEvent.setup();
    await reachSystemCheck(user);

    await user.click(
      await screen.findByRole('button', { name: /take without camera/i }),
    );

    const config = JSON.parse(sessionStorage.getItem('examConfig')!);
    expect(config).toEqual({ proctored: false });
    expect(router.push).toHaveBeenCalledWith('/exam');
  });
});
