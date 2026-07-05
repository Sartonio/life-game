# Art readability — approaches tried and reverted (2026-07-05)

Problem: stage-1/2 trees are nearly invisible in the island scene. Two root
causes were identified: **size** (all growth stages share one 384px-tall
canvas with the growth ladder baked in — stage-1 artwork is ~69px, so the
uniform `TREE_SCALE = 96/384` renders a sapling at ~17px) and **value
contrast** (green sprites on green tiles; dark trunks against the dark
half-dead/dead land, including tiles _behind_ the sprite, not just under it).

Everything below was implemented, evaluated in-game, and **reverted** —
Ryan's verdict: the original graphics read better overall; none of these
earned their complexity except possibly the tile fade (see end). Kept here
so the next attempt doesn't re-walk the same dead ends.

## 1. Per-stage render scale boost (draw.ts)

`STAGE_SCALE` multiplier table on top of the uniform `TREE_SCALE`, plus a
ground-shadow ellipse under stages 1–2.

- First cut `{1: 2.5, 2: 1.4}` → stage 1 read ~43px: **oversized, cartoonish**.
- Retuned via PIL contact sheet to `{1: 1.4, 2: 1.75}` (24px/63px) →
  **broke ladder monotonicity**: stage 2 (63px) rendered taller than
  stage 3 (56px), i.e. trees _shrank_ when growing 2→3.
- Final table `{1: 1.4, 2: 1.5, 3: 1.15, 4: 1.05, 5: 1}` with art-side
  height normalization (below) was monotonic (~24/54/64/79/93px) and
  technically fine — but only fixes size, never contrast, and added a
  second scaling system on top of the baked-in ladder. Failure mode:
  **complexity creep for a partial fix**.

Lesson: if sprite sizes are wrong, fix the _source art ladder_ (content
height as % of canvas per stage), not the renderer. Two scaling systems
fight each other.

## 2. Baked dark outline + top-left rim light (PIL post-process)

Selective-outline ("selout") pass: dilate the alpha mask for a dark outline
under the sprite, brighten the top-left silhouette edge as a rim light.
Rationale: outline separates on bright grass, rim separates on dark land,
and the treatment travels with the sprite (works against background tiles
behind the trunk, which a ground decal can't help).

- 1.2px @ 90% alpha: **too thick — crowns read as flat 2D stickers**,
  thin branches fused into a dark lattice.
- 0.7px @ 70% alpha + rim: better in contact sheets, but in-game verdict:
  **"outlines and png transparency don't seem to be working very well"** —
  visible fringe/halo artifacts where the outline meets the sprites'
  soft feathered alpha edges. The originals' painterly anti-aliased edges
  don't take a hard baked outline cleanly.
- Rim-light-only variant fit the painterly "no outline" style best but
  **lost saplings on bright grass again** — didn't solve the original bug.

Lesson: baked outlines fight the soft-alpha painterly style at the pixel
level. If separation is ever needed again, try it at render time (shader/
filter on the un-touched sprite) or regenerate art with the outline painted
in by the model, not composited onto feathered edges.

## 3. Tile "fade" — low-pass + value compression (KEEP-MAYBE, TBD)

Each tile family: Gaussian low-pass blended in (kills high-frequency pink/
white speckle noise), then multiplicative luminance compression toward a
per-family target mean (vibrant 150 → dead 100) so all terrain sits in one
mid-value band and no tile competes with sprites at the value extremes.
Gradient ordering (vibrant > v2 > v1 > dead) preserved.

- Additive luminance shift **washed hue toward pink-gray** (dead tile went
  mauve); multiplicative gain + blend-toward-own-mean-color preserved hue.
  The dead tile still needed a per-channel nudge (its source art's true
  mean color is pink-brown).
- This was the one change Ryan responded well to ("looks a lot better")
  and the only candidate for reimplementation. Reverted with the rest for
  now. **TBD.**

## 4. Sprite regeneration (tree B 2–4, tree A 2–5)

i2i generation anchored on each species' stage-5 sprite, chroma-key
(corner-sampled + despill + feather), content height normalized to a
shared ladder (18/38/58/78/97% of canvas), trunk-anchored, then outline
pass. Goals: silhouette variety per stage (B was a near-identical cone at
2–5), gradual arc for A, and equal per-stage heights across species (A's
source stage-5 was no taller than its stage 4).

- Generation quality was fine and ladders landed exactly on spec, but the
  final verdict: **style drift — the originals read better**. The model's
  edges are harder than the originals' soft cel; the chroma-key alpha
  (threshold + feather + low-alpha cutoff) produced edge quality visibly
  worse than the hand-kept originals ("png transparency… not working
  very well").

Lesson: the original set's style consistency is worth more than
per-stage silhouette variety. If regeneration is attempted again, the
whole 10-sprite set should be regenerated in one session for one edge/
style treatment — not 7 new sprites spliced next to 3 originals.

## Where things stand after the revert

- `public/art/*` and `src/modules/render/internal/draw.ts` restored to
  their pre-rework state (uniform `TREE_SCALE`, no shadows, original art).
- The unsolved problem remains: stage-1 saplings render ~17px and are
  nearly invisible; trunks blend into dark tiles behind them.
- Next candidates, in rough order of promise: reimplement the tile fade
  (§3) alone; fix the _source_ ladder heights in the original art style so
  early stages are bigger without renderer boosts; render-time separation
  (Pixi filter) instead of baked outlines.
