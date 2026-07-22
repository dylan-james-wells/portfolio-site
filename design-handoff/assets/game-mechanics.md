# trivai game-mechanics reference (for diagrams & mechanic graphics)

Real values from `trivai-tokens` source, verified 2026-07-22. These mechanics are
inherently visual — prime material for interactive or illustrated figures in
Acts 4–5. File refs are into the trivai-tokens repo.

## Ring bonuses (`lib/game/bonus.ts`)

Every correctly-answered tile projects a **ring onto its 8 surrounding tiles**
(Chebyshev distance = 1). Unanswered tiles covered by rings get multiplied:

| rings covering tile | multiplier | tier name |
|---|---|---|
| 0 | ×1.0 | base |
| 1 | ×1.5 | gold |
| 2+ | ×2.25 | electric (capped) |

Rings are cleared at turn boundaries, so bonuses are turn momentum — chaining
correct answers lights up the neighborhood around them. Perfect for an
interactive 6×6 grid demo: click a tile "correct" and watch its ring light up.

## Traps → Wildcards (`lib/game/trap.ts`)

Off-turn, a player secretly arms an unanswered tile (the server tells no one
else — secrecy enforced by the engine). When an opponent opens that tile, it
springs into a **Wildcard** worth `floor(base × ringMult × trapMult)`:

- `ringMult`: the tile's live ring bonus above (1 / 1.5 / 2.25)
- `trapMult`: by how many opponents trapped the same tile —
  1 trapper ×1.0, 2 ×1.5, 3+ ×2.25 (same ladder, reused)

Compounded total maps to a display tier:

| total multiplier | tier |
|---|---|
| < 1.5 | base |
| 1.5 – 2.24 | gold |
| 2.25 – 3.29 | electric |
| ≥ 3.3 | **prismatic** (max: 2.25 × 2.25 ≈ 5.06×) |

Stealing a Wildcard is worth `floor(base × trapMult)` only — ring bonuses
belong to the active player's momentum, never to the thief. (Same rule as
ordinary steals: one attempt per player per question; a wrong steal deducts
the same value; scores can go negative.)

## Board reshuffle (`lib/game/boardReshuffle.ts`)

The board compacts at perfect-square breakpoints as questions deplete:

    remaining 26–36 → 6×6    17–25 → 5×5    10–16 → 4×4    5–9 → 3×3    1–4 → 2×2

At each breakpoint the survivors re-pack to exactly fill the new grid, with an
"L-shuffle" animation matching the opening reveal.

## The client lockdown, verbatim (Act 4 exhibit)

The entire list of events clients are still allowed to relay after the
server-authoritative rewrite (`app/api/games/[id]/events/route.ts:25`):

```ts
const ALLOWED_EVENTS = new Set<string>([
  PUSHER_EVENTS.ANSWER_SUBMITTED,
  PUSHER_EVENTS.ANSWER_EVALUATED,
  PUSHER_EVENTS.PLAYER_LEFT,
]);
```

Three items. Everything else comes from the server. The brevity of this list
IS the graphic.

## trivai brand colors (for mechanic graphics that nod to the game)

From `app/globals.css` color tokens (the game's real tier colors):

- gold tier:      `#fbbf24` (accent) / bonus tile bg `#d4a017`, border `#996515`
- electric tier:  bonus tile bg `#7b68ee`, hover `#6a5acd`, border `#5b4fc7`, shadow `#483d8b`
- prismatic tier: rendered as an animated multi-hue treatment in-game (no single hex)

Note: these are reference swatches so diagrams read "trivai" — the page overall
should stay in the portfolio site's own visual language.

## Reusable image assets in trivai-tokens

- `public/logo.png` — trivai logo
- `public/avatars/*.svg` — player avatar icon set (book, brain, film, gamepad, …)

## Screenshot targets (capture separately; none included here)

- `https://trivai.games` marketing page — has existing Steal/Trap card designs
  and the hero board animation
- In-game board with ring bonuses + a trap reveal — requires a logged-in game;
  the trivai repo has a local playtest recipe (test account + seeded SP game)
  if fresh captures are wanted
- `/dev/trap-reveal` and `/dev/skeletons` sandboxes (admin-gated, local dev) —
  isolated renders of the trap-spring animation and loading skeletons
