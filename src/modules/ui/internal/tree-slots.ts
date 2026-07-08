// Internal implementation. Deep imports from other modules are blocked by lint.
import { ACTIVE_TREE_CAP } from '../../config/index.ts';
import { activeTrees } from '../../systems/index.ts';
import type { GameplayState } from '../../systems/index.ts';
import { ensureStyles } from './styles.ts';

export interface TreeSlots {
  el: HTMLElement;
  update(state: GameplayState): void;
}

/**
 * HUD chip showing active-tree slots ("Trees 2/3"). At the cap it switches
 * to the warn styling and sets `data-full` (same pulse pattern as `.lg-bar`).
 * Mutates the same node on every `update` — no DOM stacking.
 */
export function createTreeSlots(): TreeSlots {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'lg-chip';
  el.dataset['testid'] = 'tree-slots';

  function update(state: GameplayState): void {
    const active = activeTrees(state.trees).length;
    el.textContent = `Trees ${active}/${ACTIVE_TREE_CAP}`;
    const full = active >= ACTIVE_TREE_CAP;
    el.classList.toggle('lg-chip--warn', full);
    if (full) {
      el.setAttribute('data-full', '');
    } else {
      el.removeAttribute('data-full');
    }
  }

  return { el, update };
}
