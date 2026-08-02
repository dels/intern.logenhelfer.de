import { describe, expect, it } from 'vitest';
import { minutesBetween, shiftTime } from './timeMath';

describe('shiftTime', () => {
  it('adds minutes within the same day', () => {
    expect(shiftTime('20:00', 60)).toBe('21:00');
  });

  it('subtracts minutes within the same day', () => {
    expect(shiftTime('20:30', -30)).toBe('20:00');
  });

  it('wraps forward past midnight', () => {
    expect(shiftTime('23:30', 60)).toBe('00:30');
  });

  it('wraps backward past midnight', () => {
    expect(shiftTime('00:15', -30)).toBe('23:45');
  });

  it('is a no-op with a zero delta', () => {
    expect(shiftTime('14:05', 0)).toBe('14:05');
  });
});

describe('minutesBetween', () => {
  it('is positive when the time moved later', () => {
    expect(minutesBetween('20:00', '20:30')).toBe(30);
  });

  it('is negative when the time moved earlier', () => {
    expect(minutesBetween('20:30', '20:00')).toBe(-30);
  });

  it('is zero for an unchanged time', () => {
    expect(minutesBetween('20:00', '20:00')).toBe(0);
  });
});
