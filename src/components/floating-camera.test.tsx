import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FloatingCamera from '@/components/floating-camera';

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { mediaDevices?: unknown }).mediaDevices;
});

// TD-005: the floating preview must release its webcam stream on unmount.
describe('FloatingCamera camera lifecycle', () => {
  it('stops the camera stream when unmounted', async () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop } as unknown as MediaStreamTrack],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn(async () => stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    const { unmount } = render(<FloatingCamera />);

    // The "Your Camera" badge renders once the stream is available.
    expect(await screen.findByText(/your camera/i)).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the browser exposes no camera API', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {}, // no getUserMedia
      configurable: true,
    });

    const { container } = render(<FloatingCamera />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
