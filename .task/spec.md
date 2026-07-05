# Slice A1 — Art manifest + loader (module `assets` only)

Stacks on slice/p-a0-art (art files at public/art/, served at /art/*.png):
tile-dead, tile-vibrancy-1, tile-vibrancy-2, tile-vibrant, tile-fog,
tree-a-stage-1..5, tree-b-stage-1..5 (15 files).

Implement in `assets` (full-lane module, but keep code trivial):

1. `ART_MANIFEST`: typed map from semantic keys to URL strings. Keys reflect
   the NEW vibrancy model (tile land state is vibrancy 0-3, plus fog for
   unrevealed): tile keys for vibrancy 0 (dead) -> /art/tile-dead.png,
   1 -> /art/tile-vibrancy-1.png, 2 -> /art/tile-vibrancy-2.png,
   3 -> /art/tile-vibrant.png; fog key -> /art/tile-fog.png; tree keys for
   both TreeType ('A'|'B') x stages 1-5. Typed shape render can index
   without casts: lookup by vibrancy number 0-3 or (type, stage) is
   type-safe.
2. `loadArt(): Promise<ArtTextures>` — ONE `Assets.load` call over the
   manifest URLs (Pixi 8 Assets API), returning textures keyed the same way
   as the manifest. Export the `ArtTextures` type. Thin wrapper, untested
   (no Pixi loading in tests).
3. KEEP existing color exports (TILE_COLORS, TREE_STAGE_COLORS) — render
   still uses them until A2. Do not delete anything render imports.
4. Tests (example-based, no Pixi): manifest covers exactly the expected
   keys (4 vibrancy + fog + 2 types x 5 stages = 15), all URLs distinct,
   all start with /art/ and end with .png, stages 1-5 present for both
   types. Test through the module's public index.ts.

Constraints: only src/modules/assets/**. assets already allows pixi.js.
No new packages. No module-map.json change if not needed.

Finish: pnpm verify AND pnpm build green.
Ship: pnpm pr "feat(assets): art manifest+loader", PR base slice/p-a0-art,
branch slice/p-a1-art-manifest.
