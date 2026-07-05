// Public surface of the assets module. Other modules import ONLY from here.
export { TILE_COLORS, TREE_STAGE_COLORS } from './internal/palette.ts';
export { ART_MANIFEST } from './internal/manifest.ts';
export type { ArtMap, TreeStage, Vibrancy } from './internal/manifest.ts';
export { loadArt } from './internal/load.ts';
export type { ArtTextures } from './internal/load.ts';
