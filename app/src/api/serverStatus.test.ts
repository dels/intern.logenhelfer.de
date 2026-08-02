import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribe, reportFailure, reportSuccess, resetServerStatus } from './serverStatus';

afterEach(() => resetServerStatus());

describe('serverStatus', () => {
  it('calls a new subscriber immediately with the current (up) state', () => {
    const listener = vi.fn();
    subscribe(listener);
    expect(listener).toHaveBeenCalledWith(false);
  });

  it('notifies subscribers when reportFailure is called', () => {
    const listener = vi.fn();
    subscribe(listener);
    reportFailure();
    expect(listener).toHaveBeenLastCalledWith(true);
  });

  it('notifies subscribers when reportSuccess follows a failure', () => {
    const listener = vi.fn();
    subscribe(listener);
    reportFailure();
    reportSuccess();
    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it('does not notify again for a redundant reportFailure/reportSuccess call', () => {
    const listener = vi.fn();
    subscribe(listener);
    reportFailure();
    reportFailure();
    expect(listener).toHaveBeenCalledTimes(2); // initial (false) + one real change (true)
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();
    reportFailure();
    expect(listener).toHaveBeenCalledTimes(1); // only the initial call
  });
});
