// Internal implementation. Deep imports from other modules are blocked by lint.
import { ensureStyles } from './styles.ts';

/**
 * Placeholder Reflect button. It is visible but inert: clicking it does
 * nothing and there is no callback surface yet (wired in a later slice).
 */
export function createReflectButton(): { el: HTMLElement } {
  ensureStyles();
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'reflect-button lg-btn lg-btn--primary';
  el.dataset['testid'] = 'reflect-button';
  el.textContent = 'Reflect';
  return { el };
}
