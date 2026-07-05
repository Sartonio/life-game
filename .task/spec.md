# Slice A2 — sprite art in render

Replace Graphics color diamonds with Sprites from the loaded textures.

1. Pure part: replace `colorForTile` with `textureKeyForTile(state, vibrancy)`
   returning a semantic key (fog wins over vibrancy; vibrancy 0..3 map to the
   four tile textures). Rewrite polish-lane color-mapping tests to cover it.
2. Tiles: one Sprite per tile, texture via textureKeyForTile, width 64 /
   height 32, positioned by tileToScreen. Full-redraw strategy stays.
3. Trees: one Sprite per TreeViewModel, texture `tex.tree[type][stage]`,
   `anchor.set(0.5, 1)`, positioned at tile center, uniform scale so a
   stage-5 tree reads ~2 tiles tall (96/384 = 0.25 — do NOT normalize
   per-stage height; the growth ladder is baked into the 256x384 canvas).
4. Depth: sortableChildren on container(s); zIndex = screenY on tree sprites;
   tiles render under all trees.
5. Wiring: drawWorld/updateWorld/updateTrees keep names/roles but take (or
   close over) the loaded ArtTextures; core-app app.ts gains ONE
   `await loadArt()` during boot and passes textures through.
6. Cleanup: delete TILE_COLORS/TREE_STAGE_COLORS from assets if unused after
   the swap (knip). Rewrite remaining palette tests (polish-lane — replace,
   don't delete pure-helper coverage).
7. Constraints: no new dependencies, no spritesheet packer, no diffing/perf
   work. render may import pixi.js and assets. Keep every data-testid.

Finish: `pnpm verify` AND `pnpm build` green; check /art assets copied to dist.
Ship: branch slice/p-a2-sprite-art, draft PR base slice/p-a1-art-manifest,
body notes it stacks on #17 AND #20.
