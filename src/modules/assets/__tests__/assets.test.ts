import { describe, it, expect } from 'vitest';
import { ART_MANIFEST, TILE_COLORS, TREE_STAGE_COLORS } from '../index.ts';

function rgb(color: number): { r: number; g: number; b: number } {
  return { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
}

describe('assets placeholder palette', () => {
  it('fog is near-black (every channel dim)', () => {
    const { r, g, b } = rgb(TILE_COLORS.fog);
    expect(r).toBeLessThan(0x30);
    expect(g).toBeLessThan(0x30);
    expect(b).toBeLessThan(0x30);
  });

  it('dead is a dark sludge brown (red-leaning, dim, not green)', () => {
    const { r, g, b } = rgb(TILE_COLORS.dead);
    expect(r).toBeGreaterThan(b);
    expect(r).toBeGreaterThanOrEqual(g);
    expect(r).toBeLessThan(0x90); // dark, not a bright orange
  });

  it('vibrant is a living green (green channel dominates)', () => {
    const { r, g, b } = rgb(TILE_COLORS.vibrant);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('half-dead sits between dead and vibrant on the green channel', () => {
    const dead = rgb(TILE_COLORS.dead);
    const half = rgb(TILE_COLORS.halfDead);
    const vibrant = rgb(TILE_COLORS.vibrant);
    expect(half.g).toBeGreaterThan(dead.g);
    expect(half.g).toBeLessThan(vibrant.g);
  });

  it('all four tile colors are distinct', () => {
    const values = Object.values(TILE_COLORS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('provides five stage colors per tree type', () => {
    expect(TREE_STAGE_COLORS.A).toHaveLength(5);
    expect(TREE_STAGE_COLORS.B).toHaveLength(5);
  });

  it('type A stages are greens and type B stages are teals', () => {
    for (const color of TREE_STAGE_COLORS.A) {
      const { r, g, b } = rgb(color);
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    }
    for (const color of TREE_STAGE_COLORS.B) {
      const { r, g, b } = rgb(color);
      expect(g).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(r);
    }
  });

  it('stage colors are distinct within each type', () => {
    expect(new Set(TREE_STAGE_COLORS.A).size).toBe(5);
    expect(new Set(TREE_STAGE_COLORS.B).size).toBe(5);
  });
});

describe('art manifest', () => {
  const allUrls = [
    ...Object.values(ART_MANIFEST.tile),
    ART_MANIFEST.fog,
    ...Object.values(ART_MANIFEST.tree).flatMap((stages) => Object.values(stages)),
  ];

  it('covers exactly the expected keys (4 vibrancy levels + fog + 2 types x 5 stages)', () => {
    expect(Object.keys(ART_MANIFEST.tile).sort()).toEqual(['0', '1', '2', '3']);
    expect(typeof ART_MANIFEST.fog).toBe('string');
    expect(Object.keys(ART_MANIFEST.tree).sort()).toEqual(['A', 'B']);
    expect(allUrls).toHaveLength(15);
  });

  it('has stages 1-5 for both tree types', () => {
    for (const type of ['A', 'B'] as const) {
      expect(Object.keys(ART_MANIFEST.tree[type]).sort()).toEqual(['1', '2', '3', '4', '5']);
    }
  });

  it('all URLs are distinct', () => {
    expect(new Set(allUrls).size).toBe(allUrls.length);
  });

  it('all URLs start with /art/ and end with .png', () => {
    for (const url of allUrls) {
      expect(url).toMatch(/^\/art\/[\w-]+\.png$/);
    }
  });

  it('maps vibrancy 0 to the dead tile and 3 to the vibrant tile', () => {
    expect(ART_MANIFEST.tile[0]).toBe('/art/tile-dead.png');
    expect(ART_MANIFEST.tile[1]).toBe('/art/tile-vibrancy-1.png');
    expect(ART_MANIFEST.tile[2]).toBe('/art/tile-vibrancy-2.png');
    expect(ART_MANIFEST.tile[3]).toBe('/art/tile-vibrant.png');
    expect(ART_MANIFEST.fog).toBe('/art/tile-fog.png');
  });

  it('tree URLs encode type and stage', () => {
    for (const type of ['A', 'B'] as const) {
      for (const stage of [1, 2, 3, 4, 5] as const) {
        expect(ART_MANIFEST.tree[type][stage]).toBe(
          `/art/tree-${type.toLowerCase()}-stage-${stage}.png`,
        );
      }
    }
  });
});
