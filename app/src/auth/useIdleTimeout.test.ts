import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useIdleTimeout, getIdleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MINUTES } from './useIdleTimeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTimeout after timeoutMs of no activity', () => {
    const onTimeout = vi.fn();
    renderHook(() => useIdleTimeout(true, onTimeout, 1000));

    act(() => vi.advanceTimersByTime(999));
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('a click restarts the window (per spec: "every click restarts this time window")', () => {
    const onTimeout = vi.fn();
    renderHook(() => useIdleTimeout(true, onTimeout, 1000));

    act(() => vi.advanceTimersByTime(700));
    window.dispatchEvent(new MouseEvent('click'));
    act(() => vi.advanceTimersByTime(700));
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('a keydown also restarts the window', () => {
    const onTimeout = vi.fn();
    renderHook(() => useIdleTimeout(true, onTimeout, 1000));

    act(() => vi.advanceTimersByTime(700));
    window.dispatchEvent(new KeyboardEvent('keydown'));
    act(() => vi.advanceTimersByTime(999));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('does not start a timer at all when disabled', () => {
    const onTimeout = vi.fn();
    renderHook(() => useIdleTimeout(false, onTimeout, 1000));

    act(() => vi.advanceTimersByTime(5000));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('stops listening and clears its timer on unmount', () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useIdleTimeout(true, onTimeout, 1000));
    unmount();

    act(() => vi.advanceTimersByTime(5000));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('starting disabled then flipping to enabled starts counting from the flip, not from mount', () => {
    const onTimeout = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useIdleTimeout(enabled, onTimeout, 1000), {
      initialProps: { enabled: false },
    });

    act(() => vi.advanceTimersByTime(2000));
    expect(onTimeout).not.toHaveBeenCalled();

    rerender({ enabled: true });
    act(() => vi.advanceTimersByTime(999));
    expect(onTimeout).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});

describe('getIdleTimeoutMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to 30 minutes when VITE_IDLE_TIMEOUT_MINUTES is unset', () => {
    vi.stubEnv('VITE_IDLE_TIMEOUT_MINUTES', '');
    expect(getIdleTimeoutMs()).toBe(DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000);
  });

  it('honors a valid override', () => {
    vi.stubEnv('VITE_IDLE_TIMEOUT_MINUTES', '5');
    expect(getIdleTimeoutMs()).toBe(5 * 60 * 1000);
  });

  it('falls back to the default for a non-numeric override', () => {
    vi.stubEnv('VITE_IDLE_TIMEOUT_MINUTES', 'abc');
    expect(getIdleTimeoutMs()).toBe(DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000);
  });

  it('falls back to the default for a zero or negative override', () => {
    vi.stubEnv('VITE_IDLE_TIMEOUT_MINUTES', '0');
    expect(getIdleTimeoutMs()).toBe(DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000);

    vi.stubEnv('VITE_IDLE_TIMEOUT_MINUTES', '-5');
    expect(getIdleTimeoutMs()).toBe(DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000);
  });
});
