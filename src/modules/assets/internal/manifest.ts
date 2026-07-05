// Art manifest: semantic keys → URL strings (served verbatim from public/art/).
import type { TreeType } from '../../config/index.ts';

/** Tile land vibrancy level: 0 = dead … 3 = fully vibrant. */
export type Vibrancy = 0 | 1 | 2 | 3;

/** Tree growth stage (1–5), mirroring the growth system's stages. */
export type TreeStage = 1 | 2 | 3 | 4 | 5;

/** Shape shared by the manifest (URLs) and loaded textures. */
export interface ArtMap<T> {
  /** Tile art per vibrancy level (0 = dead → 3 = vibrant). */
  readonly tile: Readonly<Record<Vibrancy, T>>;
  /** Fog tile for still-unrevealed land. */
  readonly fog: T;
  /** Tree art per type and growth stage. */
  readonly tree: Readonly<Record<TreeType, Readonly<Record<TreeStage, T>>>>;
}

export const ART_MANIFEST: ArtMap<string> = {
  tile: {
    0: '/art/tile-dead.png',
    1: '/art/tile-vibrancy-1.png',
    2: '/art/tile-vibrancy-2.png',
    3: '/art/tile-vibrant.png',
  },
  fog: '/art/tile-fog.png',
  tree: {
    A: {
      1: '/art/tree-a-stage-1.png',
      2: '/art/tree-a-stage-2.png',
      3: '/art/tree-a-stage-3.png',
      4: '/art/tree-a-stage-4.png',
      5: '/art/tree-a-stage-5.png',
    },
    B: {
      1: '/art/tree-b-stage-1.png',
      2: '/art/tree-b-stage-2.png',
      3: '/art/tree-b-stage-3.png',
      4: '/art/tree-b-stage-4.png',
      5: '/art/tree-b-stage-5.png',
    },
  },
};
