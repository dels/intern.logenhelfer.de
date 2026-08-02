import { describe, expect, it } from 'vitest';
import { fibonacci, nextFibDelay } from './fibRetry';

describe('fibonacci', () => {
  it('returns the classic sequence for the first several indices', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(fibonacci)).toEqual([1, 2, 3, 5, 8, 13, 21]);
  });

  it('caps at 55 (the largest term <= ~60s) once the index would exceed it', () => {
    expect(fibonacci(8)).toBe(55);
    expect(fibonacci(9)).toBe(55);
    expect(fibonacci(100)).toBe(55);
  });

  it('clamps negative indices to the first term', () => {
    expect(fibonacci(-1)).toBe(1);
  });
});

describe('nextFibDelay', () => {
  it('starts at 1 second on a fresh (index 0) load', () => {
    expect(nextFibDelay(0)).toEqual({ delay: 1, nextIndex: 1 });
  });

  it('advances through the sequence on successive reloads', () => {
    expect(nextFibDelay(1)).toEqual({ delay: 2, nextIndex: 2 });
    expect(nextFibDelay(2)).toEqual({ delay: 3, nextIndex: 3 });
    expect(nextFibDelay(3)).toEqual({ delay: 5, nextIndex: 4 });
    expect(nextFibDelay(4)).toEqual({ delay: 8, nextIndex: 5 });
  });

  it('holds steady at the 55s ceiling instead of growing unboundedly', () => {
    expect(nextFibDelay(8)).toEqual({ delay: 55, nextIndex: 8 });
    expect(nextFibDelay(50)).toEqual({ delay: 55, nextIndex: 8 });
  });

  it('treats a missing/invalid sessionStorage value (NaN, negative, non-integer) as index 0', () => {
    expect(nextFibDelay(NaN)).toEqual({ delay: 1, nextIndex: 1 });
    expect(nextFibDelay(-3)).toEqual({ delay: 1, nextIndex: 1 });
    expect(nextFibDelay(1.5)).toEqual({ delay: 1, nextIndex: 1 });
  });
});
