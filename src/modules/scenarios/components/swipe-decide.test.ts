// The swipe threshold is the only part of the gesture that can be checked without a pointer.
import { describe, expect, it } from 'vitest';
import { resolveSwipe } from './swipe-decide';

describe('resolveSwipe', () => {
  it('does nothing below the threshold, in either direction', () => {
    expect(resolveSwipe(0)).toBeNull();
    expect(resolveSwipe(87)).toBeNull();
    expect(resolveSwipe(-87)).toBeNull();
  });

  it('approves at and beyond the threshold to the right', () => {
    expect(resolveSwipe(88)).toBe('approve');
    expect(resolveSwipe(220)).toBe('approve');
  });

  it('rejects at and beyond the threshold to the left', () => {
    expect(resolveSwipe(-88)).toBe('reject');
    expect(resolveSwipe(-220)).toBe('reject');
  });

  it('accepts a custom threshold', () => {
    expect(resolveSwipe(50, 40)).toBe('approve');
    expect(resolveSwipe(-50, 40)).toBe('reject');
  });
});
