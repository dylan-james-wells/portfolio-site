# Verbatim code & prompt excerpts for the making-of trivai article

All excerpts below are copied verbatim from the actual repos (verified 2026-07-22).
They are the article's primary "artifacts" — treat them as exhibits/graphics, not
body text. Suggested placement notes under each. Do not edit the quoted text;
its roughness is the point.

---

## 1. The d10 ritual (Act 1 / already quoted in the article intro)

Source: `ai-trivia/src/lib/prompts.ts` (the January 2026 prototype)

```
When you think of an answer, ask yourself: "Is this one of the top 5 most famous
examples in this category?" If yes, give yourself only a 10% chance of using it -
mentally roll a d10, and only use it on a 1. Otherwise, dig deeper and find
something from the second or third tier of popularity - still recognizable, but
not the obvious choice.

For example: If generating 70s movies and you think "Taxi Driver" - that's top 5
famous, so 90% of the time pick something else like Network, Dog Day Afternoon,
or Chinatown instead. Same for Sound of Music (60s), Lion King (90s), Back to
the Future (80s), etc.
```

The intro quotes the first sentence-pair; the fuller version with the Taxi Driver
example could appear as an expandable artifact or side panel. Note Back to the
Future appears in the model's own hall of shame — the article jokes about BTTF
questions, so highlighting that line is a nice touch.

## 2. The letter constraint + fake random seed (Act 1, "Rube Goldberg probability machine")

Source: `ai-trivia/src/lib/prompts.ts`

```
STARTING LETTER CONSTRAINT: For entertainment categories (music, movies, TV,
books, etc.) AND nature/animal categories, you must follow these rules:
- At least 2 of the 5 answers must start with a letter from SET A: ...
This forces variety - if your first instinct doesn't match either set, find
alternatives that do.

Random seed for this generation: ${Math.floor(Math.random() * 10000)}
```

## 3. The Breaking Bad plea (Act 1)

Source: `ai-trivia/src/lib/prompts.ts`

```
MEDIUM MATTERS: Movies and TV shows are DIFFERENT categories. If the category
says "movies" or "films", only use theatrical films - never TV shows,
miniseries, or streaming series. If it says "TV" or "television", only use TV
shows - never movies. Breaking Bad is a TV show, not a movie. The Godfather is
a movie, not a TV show.
```

The article calls this "furiously stamped in all caps at the bottom ... an
exasperated plea." Rendering it in a distressed/all-caps treatment would land.

## 4. The Akira rule (Act 2, "the prompt still preserves the crime scene")

Source: `trivai-tokens/lib/game/prompts.ts:156` (current production prompt)

```
CRITICAL - THE ANSWER MUST NOT APPEAR IN THE QUESTION: not verbatim, not inside
a title, name, or quote the question mentions, and not as an obvious variant or
substring. The most common failure is naming the answer entity while asking for
its name. Example of a BROKEN question: "The 1988 anime film 'Akira' centers on
a secret government experiment - what single word is the name of that
experiment, also the film's title?" - the answer ("Akira") is printed right
there in the question.
```

The article block-quotes only the BROKEN-question sentence. The full rule makes
a good expandable exhibit for the before/after prompt contrast: begging for
variety (1-3) vs encoding editorial judgment (4).

## 5. How seeds reach the prompt (Act 2, the "after" picture)

Source: `trivai-tokens/lib/game/prompts.ts` — real reference-material formats fed
to the model today, one line per retrieved record:

```
Reference Facts (use these as source material for questions):
1. {seed.name}: {seed.description}

Quotes:  1. "text" - speaker, source (year) [context]
Stats:   1. statistic (= value unit) - source [context]
Pairs:   1. Work A (1982) & Work B (1988) - shared director: person [blurb]
```

Good raw material for a pipeline diagram: category -> embed -> vector search
across 4 pools -> random sample ~10/source -> these formats -> model writes 6
questions -> review pass.

## 6. The engine's phase machine (Act 4)

Source: `trivai-tokens/lib/game/engine.ts:63` (verbatim, comments included)

```ts
export type EnginePhase =
  | "setup" // MP pre-start: questions are generated but the host hasn't dispatched `start-game`
  | "idle" // active player chooses a tile
  | "answering" // a tile is open; awaiting the active player's answer
  | "evaluating" // open-text answer submitted; awaiting the AI verdict
  | "steal_window" // MP: active player was wrong; window open for buzz-in
  | "steal_answering" // MP: a stealer buzzed; awaiting their answer
  | "steal_evaluating" // MP: stealer's answer submitted; awaiting the AI verdict
  | "steal_reveal" // MP: steal sequence done; awaiting the active player's Continue
  | "reveal"; // turn-ending direct answer resolved; awaiting the active player's Continue
```

This is the article's best candidate for an animated diagram: a state machine
that visibly steps through phases (idle -> answering -> evaluating ->
steal_window -> ...). The two "evaluating" states are where "the model thinks"
— could pulse differently.

## 7. The version log as changelog artifact (Act 6)

Source: `trivai-tokens/lib/game/generation-version.ts` (abridged, real comments)

```ts
// v8: seed-fetch cold-cache mitigation - categories pre-warm Neon's
// local file cache as they land on the board, and the ivfflat indexes
// get REINDEXed to shed bloat.
//
// v9: vector fetch LIMITs cut (100/50 -> 40/30) - beyond reading fewer
// pages, the smaller LIMIT keeps the planner on the ivfflat index for
// mid-size category filters instead of a Bitmap Heap Scan that read
// ~113MB per query (measured: GEOGRAPHY on prod).
export const GENERATION_VERSION = "v9-lean-fetch";
```

## 8. The token guard (Act 6, economy — optional)

The atomic no-double-spend decrement, described in prose in earlier drafts and
cut for length; available as a one-line exhibit if the economy section wants a
code garnish:

```sql
UPDATE "User" SET "tokenBalance" = "tokenBalance" - $amount
WHERE id = $userId AND "tokenBalance" >= $amount
```
