import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProctoringPanel, {
  selectFreshViolations,
} from '@/components/proctoring-panel';

const detectViolationsAction = vi.fn(async (_uri: string) => [] as string[]);
vi.mock('@/app/actions', () => ({
  detectViolationsAction: (uri: string) => detectViolationsAction(uri),
}));

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { mediaDevices?: unknown }).mediaDevices;
});

// TD-006: a persistent condition must not flood the log with one entry per tick.
describe('selectFreshViolations (violation-log de-dup)', () => {
  const COOLDOWN = 30000;

  it('returns a violation the first time it is seen', () => {
    const seen: Record<string, number> = {};
    expect(
      selectFreshViolations(['Phone detected.'], seen, 1000, COOLDOWN),
    ).toEqual(['Phone detected.']);
    expect(seen['Phone detected.']).toBe(1000);
  });

  it('suppresses the same violation while within the cooldown window', () => {
    const seen: Record<string, number> = {};
    selectFreshViolations(['Phone detected.'], seen, 1000, COOLDOWN);
    // Next 1.5s tick — still within the cooldown.
    expect(
      selectFreshViolations(['Phone detected.'], seen, 2500, COOLDOWN),
    ).toEqual([]);
    // 29s after the first log — still suppressed (boundary is exclusive).
    expect(
      selectFreshViolations(['Phone detected.'], seen, 30000, COOLDOWN),
    ).toEqual([]);
  });

  it('logs the violation again once the cooldown has elapsed', () => {
    const seen: Record<string, number> = {};
    selectFreshViolations(['Phone detected.'], seen, 1000, COOLDOWN);
    expect(
      selectFreshViolations(['Phone detected.'], seen, 31000, COOLDOWN),
    ).toEqual(['Phone detected.']);
    expect(seen['Phone detected.']).toBe(31000);
  });

  it('tracks each distinct violation independently', () => {
    const seen: Record<string, number> = {};
    expect(
      selectFreshViolations(
        ['Phone detected.', 'Looking away.'],
        seen,
        1000,
        COOLDOWN,
      ),
    ).toEqual(['Phone detected.', 'Looking away.']);
    // The persistent phone is suppressed while a brand-new violation is logged.
    expect(
      selectFreshViolations(
        ['Phone detected.', 'Multiple faces.'],
        seen,
        2500,
        COOLDOWN,
      ),
    ).toEqual(['Multiple faces.']);
  });
});

function mockCameraStream() {
  const stop = vi.fn();
  const stream = {
    getTracks: () => [{ stop } as unknown as MediaStreamTrack],
  } as unknown as MediaStream;
  const getUserMedia = vi.fn(async () => stream);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
  return { stop, getUserMedia };
}

// TD-005: the webcam stream must be released when the panel unmounts.
describe('ProctoringPanel camera lifecycle', () => {
  it('stops the camera stream when unmounted', async () => {
    const { stop, getUserMedia } = mockCameraStream();

    const { unmount } = render(
      <ProctoringPanel violations={[]} setViolations={vi.fn()} />,
    );

    // "System Secure" only renders once the stream is acquired and wired up.
    expect(await screen.findByText(/system secure/i)).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
