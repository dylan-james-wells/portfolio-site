# Design handoff: "Mentally roll a d10: the making of trivai"

A one-off, art-directed article page for dylanjwells.com telling the story of
building trivai (trivai.games) from a prompt-only weekend prototype into a
multiplayer RAG-based trivia game. This template is specific to this article —
it does NOT need to generalize to other content, so it can be as interesting
as the story deserves.

## What's in this folder

- `article-draft-snapshot.md` — the article text. **SNAPSHOT ONLY, still being
  rewritten.** The living draft is in the trivai repo worktree
  (`trivai-tokens/.claude/worktrees/jolly-chatterjee-8cc8eb/making-of-trivai-draft.md`).
  Refresh before final build; design against structure, not exact sentences.
- `assets/code-snippets.md` — verbatim prompt/code excerpts (the article's
  "exhibits"), each with placement notes.
- `assets/commit-activity.json` — weekly commit data for the gap chart,
  with annotations. The ~10 silent weeks are the story; activity *decays* into
  the gap rather than stopping at a cliff.
- `assets/timeline.json` — dated milestones mapped to article acts, for a
  timeline strip.
- `assets/live-counters.html` — drop-in script + span spec for live stats
  (see "Live counters" below).
- `assets/game-mechanics.md` — real mechanic values for diagrams (ring-bonus
  geometry and multipliers, trap/wildcard tier math, reshuffle breakpoints,
  the 3-item ALLOWED_EVENTS whitelist), trivai's tier brand colors, reusable
  image assets (logo, avatar SVGs), and screenshot targets.

## Article structure (design against this)

1. **Intro** — the d10 prompt quote as cold open. Hook artifact.
2. **Act 1: the four-day prototype** — prompt-only era; corny soundtrack
   (Millionaire strings, womp-womp horns); the famous-answer problem
   (Taxi Driver / Sound of Music / "Lions, tigers, and bears. Oh my!");
   the "Rube Goldberg probability machine" prompt (exhibits 1–3).
3. **Act 2: retrieval, not exhortation** — "delete everything"; seeds concept;
   the pipeline (embed → search 4 pools → sample → generate → review);
   corpus stats (188k+ seeds, 154 import scripts, 31,468 quotes, 55,866
   statistics, ~84k connections); the Akira rule (exhibit 4).
4. **Act 3: multiplayer, the naive way** — 48-hour client-relay version.
5. **Interlude: the gap** — design wall; wagering came and went; ~10 weeks of
   silence; comeback commit "add stealing"; "the missing ingredient was
   offense." THE chart moment (commit-activity.json).
6. **Act 4: the rebuild** — server-authoritative engine; phase state machine
   (exhibit 6); row-locked two-phase AI evaluation.
7. **Act 5: the missing pieces** — stealing promoted from chargeable ability to
   core rule; traps/wildcards (secret off-turn placement); ring bonuses, hot
   streaks, board reshuffle 6×6→5×5→4×4.
8. **Act 6: becoming a product** — Zod everywhere; test suite growth; the
   economy story (1 token flat → Trivia Studio forces 4 + 1-per-AI-category);
   games sell below AI cost; performance paragraph (exhibit 7).
9. **Launch** — July 11, 2026; "The womp-womp horns will return."
10. **Lessons** — five bolded takeaways.

## Graphic opportunities, ranked by story value

1. **The gap chart** (Interlude) — weekly commit bars with the silent stretch
   annotated. The article's emotional centerpiece.
2. **Before/after prompt contrast** (Act 1 → Act 2) — begging-for-variety
   exhibits vs the seeded reference-material format. Could be side-by-side
   terminal panels.
3. **Engine phase machine** (Act 4) — animated state diagram stepping through
   phases; "evaluating" states pulse while "the model thinks."
4. **RAG pipeline diagram** (Act 2) — category → embed → 4 retrieval pools →
   sample → question. Corpus counts can be live (see counters).
5. **Timeline strip** (Launch or throughout) — timeline.json.
6. **Trap/steal mechanic cards** (Act 5) — trivai.games' marketing page already
   has Steal/Trap card designs to riff on (don't copy the trivai brand style
   wholesale; this page belongs to the portfolio site's aesthetic).

## Live counters (already built server-side)

The article's stats can stay current forever. trivai exposes a public,
CORS-open, cached endpoint:

    GET https://trivai.games/api/stats/making-of
    → { seeds, triviaSeeds, quotes, statistics, connections,
        retrievalRecords, commits | null, startedAt: "2026-01-10",
        launchedAt: "2026-07-11", generatedAt }

- `commits` is null until a `GITHUB_STATS_TOKEN` env var is configured in the
  trivai Vercel project (pending; design for the null case).
- `assets/live-counters.html` has a working fetch/format script and the
  `data-trivai-stat="months|commits|records"` span convention, including
  which numbers must stay STATIC (the Launch section's "six months and 1,021
  commits" is historical and must never update).
- The draft's static numbers are already stale (repo passed 1,065 commits at
  extraction) — an argument for wiring counters early.

## Site context (scouted from this repo)

- Next.js 15.4.10 App Router, Payload CMS 3.69, pnpm, TS strict.
- Tailwind 3.4 + CSS variables; dark-only theme, primary bg
  `hsl(249 23% 10%)` (near-black purple), near-white text.
- Fonts: JetBrains Mono (body+mono) and Press Start 2P (retro pixel display) —
  already a quiz/game-adjacent vibe that suits this article.
- Component arsenal worth reusing: GlitchTextReveal, WindowReveal, TextOutline,
  ImageGlitchPan, GlitchHover, CascadingGridSlideshow, HeroSlider (Three.js +
  postprocessing), lucide-react icons, RichText (Lexical) with CodeBlock.
- Site respects `prefers-reduced-motion` and strips 3D on mobile — the article
  page must follow suit (any scroll animation/state-machine animation needs a
  reduced-motion fallback).
- Images: next/image + Payload Media collection (Vercel Blob).

## CMS recommendation (the "torn on Payload" question)

**Build it as a custom route, not Payload blocks:**
`src/app/(frontend)/making-of-trivai/page.tsx` (or `/writing/making-of-trivai`).

Rationale: this is a one-off, art-directed page with bespoke interactive
elements (gap chart, phase machine, live counters). Modeling each as a Payload
block buys reusability nobody needs (explicitly out of scope) at the cost of
schema churn and admin-UI plumbing. Keep the article text in-repo (MDX or
typed TSX sections) where it's versioned with the design that depends on its
exact beats.

Escape hatch if CMS editing becomes wanted later: keep body copy in one
Payload RichText document and hard-code only the interactive interludes. But
don't start there; the copy is still changing in git anyway.

One consequence: the page won't appear in the Pages-collection-driven nav
automatically. Link it manually wherever it should surface.

## Constraints & guardrails

- **"trivai" is ALWAYS lowercase**, even at sentence start. Tagline if ever
  needed: "Strategic Trivia Without Limits."
- The article's voice avoids em-dashes and AI-isms; pull-quotes and captions
  written during design should match (plain punctuation, warm first person).
- Numbers in the text were verified against git/code on 2026-07-22. Facts that
  move (commit count, corpus counts) should prefer the live endpoint.
- The gap is ~10 weeks (late Feb → May 8). The article says "three months"
  colloquially; the chart should not contradict the text visually — label the
  span, don't caption it with a precise duration.
- Code exhibits are verbatim quotes; do not paraphrase them for layout
  convenience (truncate with an ellipsis marker if needed).
- Don't ship real seed/question data dumps; the exhibits above are the
  approved excerpts.
