// Thin Pixi 8 Assets wrapper over the manifest. Untested by design (no Pixi
// loading in tests): everything here is a mechanical URL → Texture mapping.
import { Assets, type Texture } from 'pixi.js';
import { ART_MANIFEST, type ArtMap, type TreeStage } from './manifest.ts';

/** All manifest textures, keyed exactly like {@link ART_MANIFEST}. */
export type ArtTextures = ArtMap<Texture>;

/** Loads every manifest URL in one `Assets.load` call. */
export async function loadArt(): Promise<ArtTextures> {
  const urls = [
    ...Object.values(ART_MANIFEST.tile),
    ART_MANIFEST.fog,
    ...Object.values(ART_MANIFEST.tree).flatMap((stages) => Object.values(stages)),
  ];
  const loaded = await Assets.load<Texture>(urls);
  const tex = (url: string): Texture => {
    const texture = loaded[url];
    if (!texture) throw new Error(`Art texture failed to load: ${url}`);
    return texture;
  };
  const stagesOf = (stages: Readonly<Record<TreeStage, string>>) => ({
    1: tex(stages[1]),
    2: tex(stages[2]),
    3: tex(stages[3]),
    4: tex(stages[4]),
    5: tex(stages[5]),
  });
  return {
    tile: {
      0: tex(ART_MANIFEST.tile[0]),
      1: tex(ART_MANIFEST.tile[1]),
      2: tex(ART_MANIFEST.tile[2]),
      3: tex(ART_MANIFEST.tile[3]),
    },
    fog: tex(ART_MANIFEST.fog),
    tree: {
      A: stagesOf(ART_MANIFEST.tree.A),
      B: stagesOf(ART_MANIFEST.tree.B),
    },
  };
}
