// Internal implementation. Deep imports from other modules are blocked by lint.
import type { PlantRejection } from '../../systems/index.ts';
import { ensureStyles } from './styles.ts';

export type ToastVariant = 'info' | 'warn' | 'error';

export interface ToastHost {
  el: HTMLElement;
  show(message: string, variant?: ToastVariant): void;
}

/** Visible lifetime of a toast before it starts fading out. */
const TOAST_DURATION_MS = 3500;
/** Matches the `lg-toast-out` animation length in styles.ts. */
const TOAST_EXIT_MS = 200;
/** Oldest toast is evicted once a fourth would become visible. */
const MAX_VISIBLE = 3;

/**
 * Bottom-center toast stack. `show` appends a toast that auto-dismisses
 * after 3.5s; at most 3 are visible (the oldest is evicted); showing a
 * message that is already visible resets its timer instead of stacking a
 * duplicate. Dismissal plays the fade-out class, then removes the node.
 */
export function createToastHost(): ToastHost {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'lg-toast-host';
  el.dataset['testid'] = 'toast-host';

  // One timer per live toast so dismiss/reset never touches a neighbor.
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

  function dismiss(toast: HTMLElement): void {
    const timer = timers.get(toast);
    if (timer !== undefined) clearTimeout(timer);
    timers.delete(toast);
    toast.setAttribute('data-leaving', '');
    setTimeout(() => {
      toast.remove();
    }, TOAST_EXIT_MS);
  }

  function armTimer(toast: HTMLElement): void {
    const previous = timers.get(toast);
    if (previous !== undefined) clearTimeout(previous);
    timers.set(
      toast,
      setTimeout(() => {
        dismiss(toast);
      }, TOAST_DURATION_MS),
    );
  }

  /** Toasts still shown (not mid fade-out). */
  function visible(): HTMLElement[] {
    return [...el.querySelectorAll<HTMLElement>('.lg-toast:not([data-leaving])')];
  }

  function show(message: string, variant: ToastVariant = 'info'): void {
    const duplicate = visible().find((toast) => toast.textContent === message);
    if (duplicate) {
      armTimer(duplicate);
      return;
    }

    const toast = document.createElement('div');
    toast.className = 'lg-toast';
    if (variant !== 'info') toast.classList.add(`lg-toast--${variant}`);
    toast.dataset['testid'] = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    el.appendChild(toast);
    armTimer(toast);

    const shown = visible();
    const excess = shown.length - MAX_VISIBLE;
    for (const oldest of shown.slice(0, Math.max(0, excess))) dismiss(oldest);
  }

  return { el, show };
}

/** Reason copy shared by the tap and plant paths (single source of wording). */
const PLANT_REJECTION_COPY: Record<Exclude<PlantRejection, 'off-island'>, string> = {
  cap: 'Your grove is full — 3 trees are already growing. Finish one to plant another.',
  fogged: 'This land is still hidden in fog. Unlock more of the island to reach it.',
  occupied: 'A tree already grows here.',
};

/**
 * Toast content for a plant rejection, or undefined when the tap should be
 * ignored (water). A `tap` rejection is advisory (warn/info); a `plant`
 * rejection means a submitted plant failed, so it escalates to error.
 */
export function plantRejectionFeedback(
  reason: PlantRejection,
  source: 'tap' | 'plant',
): { message: string; variant: ToastVariant } | undefined {
  if (reason === 'off-island') return undefined;
  const message = PLANT_REJECTION_COPY[reason];
  if (source === 'plant') return { message, variant: 'error' };
  return { message, variant: reason === 'cap' ? 'warn' : 'info' };
}
