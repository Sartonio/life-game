// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createToastHost, plantRejectionFeedback } from '../index.ts';

function toasts(el: HTMLElement): HTMLElement[] {
  return [...el.querySelectorAll<HTMLElement>('[data-testid="toast"]')];
}

/** Toasts still visible (not mid fade-out). */
function live(el: HTMLElement): HTMLElement[] {
  return toasts(el).filter((toast) => !toast.hasAttribute('data-leaving'));
}

describe('ui / toast host', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an info toast by default and variant classes for warn/error', () => {
    const host = createToastHost();
    host.show('plain');
    host.show('careful', 'warn');
    host.show('broken', 'error');

    const [info, warn, error] = toasts(host.el);
    expect(info?.textContent).toBe('plain');
    expect(info?.classList.contains('lg-toast')).toBe(true);
    expect(info?.classList.contains('lg-toast--warn')).toBe(false);
    expect(warn?.classList.contains('lg-toast--warn')).toBe(true);
    expect(error?.classList.contains('lg-toast--error')).toBe(true);
  });

  it('auto-dismisses after the duration (fade-out, then removal)', () => {
    const host = createToastHost();
    host.show('bye');
    expect(toasts(host.el)).toHaveLength(1);

    vi.advanceTimersByTime(3500);
    expect(toasts(host.el)[0]?.hasAttribute('data-leaving')).toBe(true);

    vi.advanceTimersByTime(200);
    expect(toasts(host.el)).toHaveLength(0);
  });

  it('evicts the oldest toast when a fourth arrives', () => {
    const host = createToastHost();
    host.show('one');
    host.show('two');
    host.show('three');
    host.show('four');

    const visible = live(host.el).map((toast) => toast.textContent);
    expect(visible).toEqual(['two', 'three', 'four']);
  });

  it('resets the timer of a duplicate message instead of stacking it', () => {
    const host = createToastHost();
    host.show('same');
    vi.advanceTimersByTime(3000);
    host.show('same'); // 500ms of the original timer left — this resets it

    expect(toasts(host.el)).toHaveLength(1);
    vi.advanceTimersByTime(3000); // original timer would have fired by now
    expect(live(host.el)).toHaveLength(1);

    vi.advanceTimersByTime(700);
    expect(live(host.el)).toHaveLength(0);
  });

  it('a leaving toast does not suppress a fresh duplicate', () => {
    const host = createToastHost();
    host.show('again');
    vi.advanceTimersByTime(3500); // now fading out
    host.show('again');

    expect(live(host.el)).toHaveLength(1);
  });
});

describe('ui / plant rejection copy', () => {
  it('maps tap rejections to reason-specific copy and variants', () => {
    expect(plantRejectionFeedback('cap', 'tap')).toEqual({
      message: 'Your grove is full — 3 trees are already growing. Finish one to plant another.',
      variant: 'warn',
    });
    expect(plantRejectionFeedback('fogged', 'tap')).toEqual({
      message: 'This land is still hidden in fog. Unlock more of the island to reach it.',
      variant: 'info',
    });
    expect(plantRejectionFeedback('occupied', 'tap')).toEqual({
      message: 'A tree already grows here.',
      variant: 'info',
    });
  });

  it('ignores off-island taps and plants', () => {
    expect(plantRejectionFeedback('off-island', 'tap')).toBeUndefined();
    expect(plantRejectionFeedback('off-island', 'plant')).toBeUndefined();
  });

  it('escalates every plant-path rejection to the error variant with the same copy', () => {
    for (const reason of ['cap', 'fogged', 'occupied'] as const) {
      const tap = plantRejectionFeedback(reason, 'tap');
      const plant = plantRejectionFeedback(reason, 'plant');
      expect(plant?.variant).toBe('error');
      expect(plant?.message).toBe(tap?.message);
    }
  });
});
