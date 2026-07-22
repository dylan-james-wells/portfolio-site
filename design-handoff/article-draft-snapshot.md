# Mentally roll a d10: the making of trivai

In January, I asked Claude to stop being so predictable. I would eventually come to learn that there is a right way to do this and a wrong way to do this. Here's what the wrong way looks like:

> When you think of an answer, ask yourself: "Is this one of the top 5 most famous examples in this category?" If yes, give yourself only a 10% chance of using it. Mentally roll a d10, and only use it on a 1.

Yes, this was actually in the prompt. Would you believe me if I told you it sort of made the questions better? Not really, though.

But I had to find a way to stop it from writing questions only about Back to the Future. Eighties movies are close to my heart, and I wanted to broaden the horizons of my wide-eyed little trivia engine to see all the fruits the decade had to offer.

Six months, 1,021 commits, and a small ocean of tea later, trivai is a live multiplayer trivia game with a 188,000-record retrieval pipeline behind it, fueling a question generation engine that never stops surprising me as I continue to improve it. Its creation story is one of trial and error: systems that stood for weeks or months before being torn down and rebuilt, each teardown leaving behind a lesson that still shapes the game today. The liberating part was learning to recognize when it's time to stop patching and rethink the approach.

## Act 1: the four-day prototype

It all started with a little repo called `ai-trivia`, which I worked on for four days before coming up with the "trivai" name and realizing the limitations of my initial approach.

The architecture could not have been simpler. You type in six categories. One API call dreams up the whole board from nothing but the category names. A fuzzy string match decides whether your answer was close enough. No database, no accounts, no server state at all. And you know what? It worked. The first commit landed on January 10, 2026, and by the end of that weekend I had a playable Jeopardy-style game.

It had a soundtrack, too: intense Who Wants to Be a Millionaire strings that made you sweat over questions you definitely knew, and classic cartoon womp-womp horns when you got one wrong. It was deeply corny and that's the way I liked it.

The questions even seemed surprisingly good. For about an hour. Then I started noticing something.

An LLM with no grounding will reach for the most famous answer to everything, every time. Ask for 70s movies, you get Taxi Driver. Ask for 60s musicals, you get The Sound of Music. Animals? Lions, tigers, and bears. Oh my! The model isn't wrong, exactly. It's just relentlessly, boringly right, and good trivia lives in the second tier of fame, on the answers you know but wouldn't have thought of first.

By day three, the prompt resembled a surreal Rube Goldberg probability machine. I had spent most of a day doing nothing but rewriting it, convinced each time that one more instruction would do the trick. The d10 ritual you saw up top was just the start. Answers were required to begin with randomly chosen letters. Random numbers got pasted in, on the theory that seeing something different might shake loose something different. Furiously stamped in all caps at the bottom, there was an exasperated plea to understand that Breaking Bad is a TV show and not a movie.

Each hack seemed to help a little, but it was nowhere close to what I was looking for. Eventually, it clicked that I had the wrong approach entirely. I was asking the model to add a level of detail that it did not have access to. If I wanted questions to be specific, personal, and interesting, I was going to have to provide the information to make them that way.

The challenge became clear. What I was really building was an "interesting information" retrieval system. That meant a database, embeddings, retrieval. A real system. So on January 14, I started a new repo.

## Act 2: retrieval, not exhortation

What is the best way to start over? One of the first commits in the new repo contains the answer: "delete everything." It was as cathartic as it sounds. After a day of setup, I started working on vector search. Retrieval would be the core of the new app, not some optimization I bolted on later.

The core idea is something I started calling **seeds**: little structured records of facts, stored in Postgres with pgvector embeddings. A movie and its description. An animal and its weird habits. A historical event and its dates.

Now when you type a category, the pipeline embeds your text, goes hunting through the seed tables for the closest matches, grabs a few dozen candidates, and randomly samples about ten per source. Those get handed to the model with a much humbler request: here are some facts, write six questions about them.

All the tricks were removed. We didn't need them anymore. If the sample happens to surface *Dog Day Afternoon* instead of *Taxi Driver*, then the question is about Dog Day Afternoon. There are still questions about the hits, but now they appear at an appropriate ratio. The randomness moved out of the model's imagination and into the database query, where it belonged.

This endeavor would grow into the biggest engineering effort of the whole project. The "interesting information" half of the system turned out to be almost the whole job. Anyone can call a model and ask for trivia questions. Not everyone has a warehouse of interesting facts ready to hand it. Six months later it looks like this:

- 188,000+ seed records with embeddings
- 154 import scripts for scraping and structuring source material from Wikipedia, Wikiquote, and elsewhere
- Four searchable pools, not one: descriptive seeds, example trivia questions, 31,468 quotes (movie, book, historical, TV), and 55,866 statistics (box office numbers, animal records, geographic facts)
- About 84,000 "connections": precomputed pairs of works that share a credited person, so the game can ask cross-work questions ("what do these two films have in common?") without any embedding lookup at all

Instead of requesting variety, the prompt now encodes editorial judgment about what makes a question good. As much as things had improved, though, the early-day quirks still peeked through. One of the funnier rules was born from a real failure in a real game, and the prompt still preserves the crime scene:

> Example of a BROKEN question: "The 1988 anime film 'Akira' centers on a secret government experiment - what single word is the name of that experiment, also the film's title?"

On several occasions I saw questions where the answer was embedded in the question itself. Then when I introduced a rule to try to prevent it, I had to add a counter-rule so the AI wouldn't be coy where it was completely unnecessary ("in the 1984 film where Soviet troops invade a Colorado town..." instead of just saying Red Dawn). There's now a whole family of rules dedicated to catching answer leakage.

## Act 3: multiplayer, the naive way

There isn't really a limit when it comes to the quality of question generation. I had already spent a lot of time on it, and it occurred to me that I had to start focusing on other aspects of the project if I wanted to get something released. Multiplayer was the feature that intimidated me the most, as I had never built anything like it before. It was the beginning of February when I decided to get started.

In 48 hours, I had a quick and dirty version. It worked the way every first multiplayer implementation works. The game ran in the active player's browser, and their client broadcast whatever happened to everyone else over Pusher. Client says "I got it right, give me 400 points," and everyone's UI politely obliges.

If you've built multiplayer before, you can see exactly where this is going. Clients that broadcast state are clients that can lie about state. Pusher client events silently fail if a dashboard toggle isn't set. There's no server-side record of what happened, so every desync becomes an archaeology dig. That's fine for a proof of concept, but not when you're trying to build a real product.

## Interlude: the three-month gap

After setting up the early version of multiplayer, progress slowed to a halt. The honest reason is that I'd hit a design wall, not a technical one. The game worked, but it felt like it was missing some key mechanic, and I couldn't tell you what it was. I had already tried ideas on and taken them back off (wagering came and went), and I was out of guesses. So I drifted. Side projects don't die from failure; they die from silence, and this one came close.

What I'll say in the project's defense: the version that went dark was already fun to play. That mattered more than I realized at the time. When I came back, I wasn't dragging myself back to an obligation. I was coming back to a game I missed.

The comeback commit, dated May 8: "add stealing." Apparently three months of not thinking about the problem produced an answer that three weeks of staring at it hadn't: the missing ingredient was offense.

## Act 4: the reckoning, or rebuilding multiplayer properly

Adding the steal mechanic is what finally broke my patience with the client-driven architecture. Steals are adversarial by design: players race to answer after someone misses, wrong guesses cost points, and everything hangs on a timing window. Every piece of that needs a referee, and "whichever browser broadcasts first" is not a referee.

It was the January lesson all over again, one layer down: stop patching, rebuild the layer. So in late May I wrote up a plan for a clean-cutover, server-authoritative rewrite, and over one very tea-fueled stretch, with Claude Code carrying a lot of the keystrokes, it landed in seven phases.

The heart of it is a pure reducer. The entire game (turns, answering, evaluation, steals, reveals) is one state machine: `reduce(state, action, context)` goes in, new state comes out. No network calls inside, no database, no randomness. Even the clock gets passed in. And because it's pure, I can test every gnarly timing edge case on my laptop, instead of trying to reproduce it live with two phones and a prayer.

Around that reducer sits a transactional harness. Every gameplay action goes through one endpoint, which locks the game's database row, loads the state, asks the reducer whether the move is even legal, saves with a version guard, and only broadcasts after the commit sticks. If two actions hit the same game at once, the database sorts them out. Pusher got demoted from source of truth to messenger; if a broadcast gets lost, the state is already safe and clients simply refetch it.

And the clients? No longer trusted. The old relay endpoint got locked down to a short whitelist of harmless cosmetic events (typing indicators, mostly), and everything that carries actual game state now comes from the server. Clients went from being authors of the game to being renderers of it.

The trickiest part was AI answer evaluation. The model judges the open-text answers, and an API call can take a few seconds; you cannot hold a database lock while a language model sits there thinking. So evaluation happens in two phases: lock, note that we're evaluating, unlock. Ask the model with no lock held. Re-lock, make sure the game hasn't moved on without us, and either commit the verdict or toss it. The subtle bugs were all timing: at one point the steal window was expiring before anyone ever saw it, because the model thought too long.

## Act 5: the missing pieces

Stealing had cracked the design wall, but it turned out to be only half the answer.

Even stealing had to earn its place first. It entered the game as a chargeable ability, a limited resource you spent like a reroll. It kept being the best part of every playtest, so it got promoted to a core rule: when someone misses a question, anyone can jump in and steal it, one attempt each, with risk as the only limiter. Steal right and the points are yours. Steal wrong and you pay the same amount out of your own score.

The other half of the answer arrived in June. Traps. On someone else's turn, you quietly arm a tile. The server tells no one but you; the secrecy is enforced by the engine itself, not just hidden in the UI. When an opponent opens that tile, it springs into a Wildcard with stacking multipliers.
The board got livelier around them too: bonus multipliers arranged in a ring pattern, hot streaks for stringing correct answers together, and a reshuffle mechanic where the 6×6 grid compacts down to 5×5, then 4×4 as questions run out, with the tile animation built by hand because the off-the-shelf animation library and my question modal could not agree on timing.

## Act 6: becoming a product

With traps in place, the game finally felt whole. What remained was the montage phase, the unglamorous work that sits between "it works" and "it's a product." Zod schemas now check every API input, every Pusher payload, every JSON column I read back out of my own database, and every AI response.
The test suite grew up too. Unit tests had covered the core logic since the early weeks, but the montage took things much further: around 574 tests across 42 files, coverage on 51 of 52 API routes, and Playwright runs that pilot two real browsers through an actual multiplayer game over actual Pusher. CI gates every merge, and it has saved me from myself more than once.

Then there's the economy. Pricing started as simple as it gets: one token per game. That held up right until Trivia Studio arrived and players could build their own categories. A game built from hand-made categories costs me almost nothing to run, while a game full of AI-generated ones costs real money, and charging the same for both stopped making sense. So, fairly late in the process, I refactored the whole economy: 4 tokens per game, plus 1 for each AI-generated category. Every generation call logs its usage, and the resulting cost dashboard tells me an uncomfortable truth: games currently sell for less than the AI costs to run them. Known problem. Measured problem. That's what the measuring was for.

The same instrumentation carried the last fight before launch: performance. Question generation was sometimes fast and sometimes brutally slow, and the culprit wasn't the AI calls but the vector search in front of them; the indexes had outgrown the database's cache, so a cold lookup could eat whole seconds before the AI was even invoked. The fixes were pure montage material: quietly pre-warm the cache while the player is still picking categories, rebuild the indexes after bulk updates, and fetch less so the query planner doesn't wander off the index. Every attempt got a version tag stamped onto its cost and latency rows, which turned "I think it's faster now" into an actual chart.

## Launch

trivai went public on July 11, 2026, with live Stripe payments. Six months and 1,021 commits after a prompt asked Claude to roll imaginary dice.

Since then: GDPR data export and erasure, an in-app feedback system, and a whole new respect for the deploy button now that real people's money is on the line.

The corny soundtrack, I'm sorry to report, did not survive the rewrite. The sound controls are still in the game, currently disabled behind a little "coming soon" tooltip. The womp-womp horns will return.

## What I'd tell you if you're building something like this

**Prompts are a prototype tool. Retrieval is an architecture.** If you find yourself writing ever-sterner instructions to make a model act against its own instincts, that's the system telling you the knowledge belongs outside the model. The d10 never stood a chance.

**Client-authoritative multiplayer is a loan.** It buys you a demo in a weekend, and you pay it back with a rewrite. For what it's worth, I'd take the loan again. That weekend demo is what kept me hooked. Just know the interest rate going in.

**The model is a trust boundary.** Validate AI output like it's hostile user input, because structurally that's exactly what it is: text from outside your system that you're about to act on.

**The dataset is the product.** The game engine is a state machine; any patient programmer could write one. The thing that makes the questions worth answering is 188,000 curated, embedded, cross-linked records, and that took more sustained effort than any code in the repo.

**Instrument before you optimize, and version your experiments.** A one-line version constant made every generation experiment comparable against real production data.