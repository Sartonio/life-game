// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { ACTIVE_TREE_CAP, TASKS_PER_TREE } from '../../config/index.ts';
import type { Tree } from '../../config/index.ts';
import { createTree } from '../../entities/index.ts';
import type { GameplayState } from '../../systems/index.ts';
import { createWorld } from '../../world/index.ts';
import { createTreeSlots } from '../index.ts';

/** `active` growing trees plus `grown` fully finished ones. */
function stateWith(active: number, grown = 0): GameplayState {
  const trees: Tree[] = [
    ...Array.from({ length: active }, (_, i) =>
      createTree(`active-${i}`, { x: i, y: 0 }, 'A', 'goal'),
    ),
    ...Array.from({ length: grown }, (_, i) => ({
      ...createTree(`grown-${i}`, { x: i, y: 1 }, 'A', 'goal'),
      tasksDone: TASKS_PER_TREE,
    })),
  ];
  return { trees, goals: {}, world: createWorld() };
}

describe('ui / tree slots', () => {
  it('shows active trees against the cap, ignoring fully grown trees', () => {
    const slots = createTreeSlots();

    slots.update(stateWith(0));
    expect(slots.el.textContent).toBe(`Trees 0/${ACTIVE_TREE_CAP}`);

    slots.update(stateWith(2, 5));
    expect(slots.el.textContent).toBe(`Trees 2/${ACTIVE_TREE_CAP}`);
    expect(slots.el.hasAttribute('data-full')).toBe(false);
    expect(slots.el.classList.contains('lg-chip--warn')).toBe(false);
  });

  it('switches to warn styling with data-full at the cap, and back off below it', () => {
    const slots = createTreeSlots();

    slots.update(stateWith(ACTIVE_TREE_CAP));
    expect(slots.el.textContent).toBe(`Trees ${ACTIVE_TREE_CAP}/${ACTIVE_TREE_CAP}`);
    expect(slots.el.hasAttribute('data-full')).toBe(true);
    expect(slots.el.classList.contains('lg-chip--warn')).toBe(true);

    slots.update(stateWith(ACTIVE_TREE_CAP - 1, 1));
    expect(slots.el.hasAttribute('data-full')).toBe(false);
    expect(slots.el.classList.contains('lg-chip--warn')).toBe(false);
  });

  it('does not stack DOM across repeated updates', () => {
    const slots = createTreeSlots();
    slots.update(stateWith(1));
    slots.update(stateWith(1));
    expect(slots.el.childNodes).toHaveLength(1); // the single text node
  });
});
