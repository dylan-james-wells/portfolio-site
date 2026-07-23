# Starter prompt for the design session

Copy everything below the line into a fresh Claude session running in
`~/Documents/apps/portfolio-site`.

---

I'm building a one-off, art-directed article page for my personal site
(dylanjwells.com, this repo) to publish "Mentally roll a d10: the making of
trivai" — the story of building my AI trivia game from a prompt-only weekend
prototype into a multiplayer RAG-based product.

**Start by reading `design-handoff/HANDOFF.md`**, then the files in
`design-handoff/assets/` (code exhibits, game-mechanics values, commit-activity
data, timeline, live-counter script) and `design-handoff/article-draft-snapshot.md`
for the text. The draft is still being edited, so design against its structure
and beats, not exact sentences.

**Aesthetic direction.** This template is for this article only; it does not
need to generalize. Extend the existing site's language rather than inventing a
new one:

- The homepage is near-black with film grain, JetBrains Mono, and a typewriter
  effect that types out code with chromatic aberration. The article is about
  prompts typed into a machine, so this motif is a gift: consider a hero that
  types the d10 prompt itself before the title resolves.
- The site also has a 3D/wireframe vocabulary (concentric rings, glowing
  primitives, red/teal chromatic pairs) and components like GlitchTextReveal,
  WindowReveal, TextOutline, plus Press Start 2P for retro display type.
  A d10/dice motif in that wireframe style would fit both site and story.
- Long-form readability comes first: the body is ~1,900 words of warm,
  first-person prose. Grain, glitch, and animation belong at section
  boundaries and exhibits, not on body text.

**The set-piece moments, in story order** (details and data in the handoff):

1. Hero: the d10 prompt as cold open.
2. Act 1: the prompt-hack exhibits, styled as terminal artifacts.
3. Interlude: the commit-activity gap chart. The ~10 silent weeks are the
   emotional centerpiece; the data shows activity decaying into silence.
4. Act 4: the engine phase state machine (could animate through phases).
5. Act 5: ring-bonus / trap mechanics (real multiplier math in
   assets/game-mechanics.md; trivai tier colors included for accents).
6. Live counters in the intro sentence (script + span spec in
   assets/live-counters.html; static text is the no-JS fallback, and the
   Launch section's numbers must stay static).

**Implementation constraints:**

- Build it as a custom route (suggested: `src/app/(frontend)/making-of-trivai/`),
  NOT as Payload blocks — rationale in the handoff. Keep the site's global
  header/footer unless there's a strong reason to go full-bleed.
- Respect `prefers-reduced-motion` and strip heavy effects on mobile, as the
  rest of the site does. The page must read perfectly with zero animation.
- "trivai" is always lowercase, even at sentence start.
- Code exhibits are verbatim quotes; never paraphrase them for layout.
- Don't restyle anything outside this page.

**Process:** propose the overall page concept and section layout first (a
written walkthrough is fine) before building, so I can steer the direction
cheaply. Then build incrementally and verify in the browser preview as you go,
including a mobile-width and reduced-motion check before calling it done.
