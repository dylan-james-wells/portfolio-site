import type { Metadata } from 'next'
import React from 'react'
import Image from 'next/image'
import { cn } from '@/utilities/ui'

import { HeroCanvas } from './HeroCanvas'
import { IntroStats } from './IntroStats'
import { GapChart } from './GapChart'
import { PhaseCanvas } from './PhaseCanvas'
import { BoardDemo } from './BoardDemo'
import styles from './styles.module.css'

import shotBoard from './assets/shot-board.png'
import shotCatselect from './assets/shot-catselect-filled.png'
import shotStudio from './assets/shot-studio.png'

export const metadata: Metadata = {
  title: 'the making of trivai — Dylan Wells',
  description:
    "A weekend of prompt hacks became a multiplayer game with a 188,000-record retrieval engine behind it. Here's how it got built.",
}

/* stacked 2px-bordered act header */
const ActHeader: React.FC<{
  eyebrow: string
  title: string
  eyebrowColor?: string
  bg?: string
}> = ({ eyebrow, title, eyebrowColor = '#ff6b6b', bg = 'hsl(249 23% 7%)' }) => (
  <div style={{ display: 'inline-block', marginBottom: 34 }}>
    <div style={{ border: '2px solid #fff', borderBottom: 0, padding: '10px 16px', background: bg }}>
      <span
        style={{
          fontFamily: 'var(--font-press-start), monospace',
          fontSize: 11,
          color: eyebrowColor,
        }}
      >
        {eyebrow}
      </span>
    </div>
    <div style={{ border: '2px solid #fff', padding: '12px 16px', background: bg }}>
      <span style={{ fontSize: 18, fontWeight: 800 }}>{title}</span>
    </div>
  </div>
)

/* terminal-window chrome shared by exhibits and figures */
const WindowBar: React.FC<{ label: React.ReactNode; labelColor?: string; borderColor?: string }> = ({
  label,
  labelColor = 'hsl(215 20% 60%)',
  borderColor = 'rgba(255,255,255,0.2)',
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '9px 12px',
      borderBottom: `2px solid ${borderColor}`,
      background: 'hsl(249 23% 9%)',
    }}
  >
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff6b6b' }} />
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#d9a827' }} />
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ecdc4' }} />
    <span style={{ marginLeft: 8, fontSize: 11, color: labelColor }}>{label}</span>
  </div>
)

const proseP: React.CSSProperties = { margin: '0 0 28px' }
const prosePLast: React.CSSProperties = { margin: 0 }

export default function MakingOfTrivaiPage() {
  return (
    <div className={styles.page}>
      {/* film grain */}
      <div className={styles.grain} />

      {/* ============================ HERO ============================ */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <HeroCanvas
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            zIndex: 1,
          }}
        />

        <div
          className={styles.pad}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 1120,
            margin: '0 auto',
            padding: '0 40px',
            pointerEvents: 'none',
          }}
        >
          <h1
            className={styles.title}
            style={{
              margin: 0,
              fontFamily: 'var(--font-press-start), monospace',
              fontSize: 'clamp(20px,3.2vw,36px)',
              lineHeight: 1.5,
              textTransform: 'lowercase',
              color: 'hsl(210 40% 98%)',
              textShadow: '0 3px 18px rgba(6,8,16,0.9)',
            }}
          >
            the making of
          </h1>
          <div
            className={styles.fadeUp1}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.mark}
              src="/trivai/trivai-mark.svg"
              alt=""
              width={46}
              height={46}
              style={{ display: 'block', filter: 'drop-shadow(0 3px 14px rgba(6,8,16,0.85))' }}
            />
            <span
              className={styles.lockup}
              style={{
                fontFamily: 'var(--font-play), sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(38px,5.2vw,58px)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                textTransform: 'lowercase',
                whiteSpace: 'nowrap',
                transform: 'translateY(-2px)',
              }}
            >
              <span style={{ color: '#fff', textShadow: '0 3px 16px rgba(6,8,16,0.9)' }}>triv</span>
              <span style={{ color: '#70c0ff', textShadow: '0 0 20px rgba(112,192,255,0.55)' }}>
                ai
              </span>
            </span>
          </div>
          <div
            className={styles.fadeUp2}
            style={{
              marginTop: 24,
              maxWidth: 520,
              fontSize: 15,
              lineHeight: 1.9,
              color: 'hsl(215 20% 76%)',
              textShadow: '0 2px 12px rgba(6,8,16,0.95)',
            }}
          >
            A weekend of prompt hacks became a multiplayer game with a 188,000-record retrieval
            engine behind it. Here&apos;s how it got built.
          </div>
          <div
            className={styles.fadeUp3}
            style={{
              marginTop: 26,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 18,
              fontSize: 12,
              letterSpacing: '0.1em',
              color: 'hsl(215 20% 58%)',
            }}
          >
            <span>DYLAN WELLS</span>
            <span style={{ color: '#ff6b6b' }}>·</span>
            <span>JULY 2026</span>
            <span style={{ color: '#ff6b6b' }}>·</span>
            <span>9 MIN READ</span>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'hsl(215 20% 50%)',
          }}
        >
          SCROLL ▾
        </div>
      </section>

      {/* ============================ INTRO ============================ */}
      <section
        className={cn(styles.pad, styles.prose)}
        style={{ maxWidth: 760, margin: '0 auto', padding: '40px 30px 0' }}
      >
        <p style={proseP}>
          In January, I asked Claude to stop being so predictable. I would eventually come to learn
          that there is a right way to do this and a wrong way to do this. Here&apos;s what the
          wrong way looks like:
        </p>
        <blockquote
          style={{
            margin: '0 0 28px',
            padding: '18px 22px',
            borderLeft: '3px solid #4ecdc4',
            background: 'hsl(249 23% 7%)',
            fontSize: 14.5,
            lineHeight: 1.9,
            color: '#4ecdc4',
          }}
        >
          When you think of an answer, ask yourself: &quot;Is this one of the top 5 most famous
          examples in this category?&quot; If yes, give yourself only a 10% chance of using it.
          Mentally roll a d10, and only use it on a 1.
        </blockquote>
        <p style={proseP}>
          Yes, this was actually in the prompt. Would you believe me if I told you it sort of made
          the questions better? Not really, though.
        </p>
        <p style={proseP}>
          But I had to find a way to stop it from writing questions only about Back to the Future.
          Eighties movies are close to my heart, and I wanted to broaden the horizons of my
          wide-eyed little trivia engine to see all the fruits the decade had to offer.
        </p>
        <IntroStats />
      </section>

      {/* ============================ ACT 1 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 1" title="the four-day prototype" />
        <div className={styles.prose}>
          <p style={proseP}>
            It all started with a little repo called <code style={{ color: '#4ecdc4' }}>ai-trivia</code>,
            which I worked on for four days before coming up with the &quot;trivai&quot; name and
            realizing the limitations of my initial approach.
          </p>
          <p style={proseP}>
            The architecture could not have been simpler. You type in six categories. One API call
            dreams up the whole board from nothing but the category names. A fuzzy string match
            decides whether your answer was close enough. No database, no accounts, no server state
            at all. And you know what? It worked. The first commit landed on January 10, 2026, and
            by the end of that weekend I had a playable Jeopardy-style game.
          </p>
          <p style={proseP}>
            It had a soundtrack, too: intense Who Wants to Be a Millionaire strings that made you
            sweat over questions you definitely knew, and classic cartoon womp-womp horns when you
            got one wrong. It was deeply corny and that&apos;s the way I liked it.
          </p>
          <p style={proseP}>
            The questions even seemed surprisingly good. For about an hour. Then I started noticing
            something.
          </p>
        </div>

        <figure className={styles.fig} style={{ margin: '8px 0 34px' }}>
          <div className={styles.figbar}>
            <span className={styles.dot} style={{ background: '#ff6b6b' }} />
            <span className={styles.dot} style={{ background: '#d9a827' }} />
            <span className={styles.dot} style={{ background: '#4ecdc4' }} />
            <span style={{ marginLeft: 8 }}>trivai.games — the board, six categories deep</span>
          </div>
          <Image
            src={shotBoard}
            alt="The trivai game board: six colored category headers over a grid of 100/250/500 point tiles."
            style={{ display: 'block', width: '100%', height: 'auto' }}
            sizes="(max-width: 820px) 100vw, 700px"
          />
          <figcaption className={styles.cap}>
            The Jeopardy-style grid that survived every rewrite. The shape of this screen is the one
            thing that never changed.
          </figcaption>
        </figure>

        <div className={styles.prose}>
          <p style={proseP}>
            An LLM with no grounding will reach for the most famous answer to everything, every
            time. Ask for 70s movies, you get Taxi Driver. Ask for 60s musicals, you get The Sound
            of Music. Animals? Lions, tigers, and bears. Oh my! The model isn&apos;t wrong, exactly.
            It&apos;s just relentlessly, boringly right, and good trivia lives in the second tier of
            fame, on the answers you know but wouldn&apos;t have thought of first.
          </p>
          <p style={proseP}>
            By day three, the prompt resembled a Rube Goldberg probability machine. I had spent most
            of a day writing it, and surely one more instruction would do the trick.
          </p>
        </div>

        {/* Exhibit 1: the dice roll */}
        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <WindowBar label="ai-trivia/src/lib/prompts.ts — exhibit 1: asking the model to roll dice" />
          <pre
            style={{
              margin: 0,
              padding: '18px 20px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              lineHeight: 1.85,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`When you think of an answer, ask yourself: "Is this one of the top 5 most famous
examples in this category?" If yes, give yourself only a 10% chance of using it -
mentally roll a d10, and only use it on a 1. Otherwise, dig deeper and find
something from the second or third tier of popularity - still recognizable, but
not the obvious choice.

For example: If generating 70s movies and you think "Taxi Driver" - that's top 5
famous, so 90% of the time pick something else like Network, Dog Day Afternoon,
or Chinatown instead. Same for Sound of Music (60s), Lion King (90s), `}
            <mark style={{ background: 'rgba(255,107,107,0.25)', color: '#ffb3b3' }}>
              {`Back to
the Future (80s)`}
            </mark>
            {`, etc.`}
          </pre>
        </div>
        <div style={{ margin: '-18px 0 30px', fontSize: 12, color: 'hsl(215 20% 55%)' }}>
          ↑ the examples name the exact defaults I was fighting — including the one that started all
          this.
        </div>

        <div className={styles.prose}>
          <p style={proseP}>
            The imaginary dice roll you saw up top was just the start. Answers were required to
            begin with randomly chosen letters. Random numbers got pasted in, on the theory that
            seeing something different might shake loose something different.
          </p>
        </div>

        {/* Exhibit 2 */}
        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <WindowBar label="ai-trivia/src/lib/prompts.ts — exhibit 2: the letter constraint + fake random seed" />
          <pre
            style={{
              margin: 0,
              padding: '18px 20px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              lineHeight: 1.85,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`STARTING LETTER CONSTRAINT: For entertainment categories (music, movies, TV,
books, etc.) AND nature/animal categories, you must follow these rules:
- At least 2 of the 5 answers must start with a letter from SET A: ...
This forces variety - if your first instinct doesn't match either set, find
alternatives that do.

Random seed for this generation: \${Math.floor(Math.random() * 10000)}`}
          </pre>
        </div>

        <div className={styles.prose}>
          <p style={proseP}>
            Near the bottom, under a capitalized heading for emphasis, sat a rule spelling out that
            Breaking Bad is a TV show and not a movie.
          </p>
        </div>

        {/* Exhibit 3: distressed */}
        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,107,107,0.65)',
            background: 'hsl(249 30% 7%)',
            position: 'relative',
          }}
        >
          <WindowBar
            label="exhibit 3: the plea (verbatim, bottom of the prompt)"
            labelColor="#ff9b9b"
            borderColor="rgba(255,107,107,0.3)"
          />
          <pre
            className={styles.distressed}
            style={{
              margin: 0,
              padding: '18px 20px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              lineHeight: 1.85,
              color: '#ffb3b3',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`MEDIUM MATTERS: Movies and TV shows are DIFFERENT categories. If the category
says "movies" or "films", only use theatrical films - never TV shows,
miniseries, or streaming series. If it says "TV" or "television", only use TV
shows - never movies. Breaking Bad is a TV show, not a movie. The Godfather is
a movie, not a TV show.`}
          </pre>
        </div>

        <div className={styles.prose}>
          <p style={proseP}>
            Each hack seemed to help a little, but it was nowhere close to what I was looking for.
            Eventually, it clicked that I had the wrong approach entirely. I was asking the model to
            add a level of detail that it did not have access to. If I wanted questions to be
            specific, personal, and interesting, I was going to have to provide the information to
            make them that way.
          </p>
          <p style={prosePLast}>
            The challenge became clear. What I was really building was an &quot;interesting
            information&quot; retrieval system. That meant a database, embeddings, retrieval. A real
            system. So on January 14, I started a new repo.
          </p>
        </div>
      </section>

      {/* ============================ ACT 2 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 2" title="retrieval, not exhortation" />
        <div className={styles.prose}>
          <p style={proseP}>
            What is the best way to start over? One of the first commits in the new repo contains
            the answer: &quot;delete everything.&quot; It was as cathartic as it sounds. After a day
            of setup, I started working on vector search. Retrieval would be the core of the new
            app, not some optimization I bolted on later.
          </p>
          <p style={proseP}>
            The core idea is something I started calling{' '}
            <strong style={{ fontWeight: 800 }}>seeds</strong>: little structured records of facts,
            stored in Postgres with pgvector embeddings. A movie and its description. An animal and
            its weird habits. A historical event and its dates.
          </p>
          <p style={proseP}>
            Now when you type a category, the pipeline embeds your text, goes hunting through the
            seed tables for the closest matches, grabs a few dozen candidates, and randomly samples
            about ten per source. Those get handed to the model with a much humbler request: here
            are some facts, write six questions about them.
          </p>
        </div>
      </section>

      {/* before/after breakout */}
      <section
        className={styles.pad}
        style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 30px 0' }}
      >
        <div
          className={styles.cols}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              border: '2px solid rgba(255,107,107,0.55)',
              background: 'hsl(249 23% 6%)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '9px 12px',
                borderBottom: '2px solid rgba(255,107,107,0.3)',
                fontSize: 11,
                letterSpacing: '0.1em',
                color: '#ff9b9b',
                background: 'hsl(249 23% 9%)',
              }}
            >
              BEFORE — BEGGING FOR VARIETY
            </div>
            <pre
              style={{
                margin: 0,
                padding: '16px 18px',
                fontSize: 12.5,
                lineHeight: 1.85,
                color: 'hsl(215 20% 70%)',
                whiteSpace: 'pre-wrap',
                flex: 1,
              }}
            >
              {`"give yourself only a 10% chance"
"mentally roll a d10"
"must start with a letter from SET A"
"Random seed for this generation: 4821"
"Breaking Bad is a TV show, not a movie."`}
            </pre>
          </div>
          <div
            style={{
              border: '2px solid rgba(78,205,196,0.55)',
              background: 'hsl(249 23% 6%)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '9px 12px',
                borderBottom: '2px solid rgba(78,205,196,0.3)',
                fontSize: 11,
                letterSpacing: '0.1em',
                color: '#7fe6dd',
                background: 'hsl(249 23% 9%)',
              }}
            >
              AFTER — REFERENCE MATERIAL (VERBATIM FORMATS)
            </div>
            <pre
              style={{
                margin: 0,
                padding: '16px 18px',
                fontSize: 12.5,
                lineHeight: 1.85,
                color: '#a8e6cf',
                whiteSpace: 'pre-wrap',
                flex: 1,
              }}
            >
              {`Reference Facts (use these as source material for questions):
1. {seed.name}: {seed.description}

Quotes:  1. "text" - speaker, source (year) [context]
Stats:   1. statistic (= value unit) - source [context]
Pairs:   1. Work A (1982) & Work B (1988) - shared director: person [blurb]`}
            </pre>
          </div>
        </div>
        {/* pipeline strip */}
        <div
          style={{
            marginTop: 20,
            border: '2px solid rgba(255,255,255,0.25)',
            background: 'hsl(249 23% 7%)',
            padding: '20px 22px',
            overflowX: 'auto',
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4', marginBottom: 14 }}>
            THE PIPELINE
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12.5,
              whiteSpace: 'nowrap',
              color: 'hsl(210 40% 94%)',
            }}
          >
            <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '7px 11px' }}>
              category
            </span>
            <span style={{ color: '#ff6b6b' }}>→</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '7px 11px' }}>
              embed
            </span>
            <span style={{ color: '#ff6b6b' }}>→</span>
            <span style={{ border: '1px solid #4ecdc4', padding: '7px 11px', color: '#4ecdc4' }}>
              search 4 pools
            </span>
            <span style={{ color: '#ff6b6b' }}>→</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '7px 11px' }}>
              sample ~10/source
            </span>
            <span style={{ color: '#ff6b6b' }}>→</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '7px 11px' }}>
              6 questions
            </span>
            <span style={{ color: '#ff6b6b' }}>→</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '7px 11px' }}>
              review
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, marginTop: 22 }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 17,
                  color: '#4ecdc4',
                }}
              >
                188k+
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 60%)', marginTop: 7 }}>
                seed records
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 17,
                  color: '#fff',
                }}
              >
                154
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 60%)', marginTop: 7 }}>
                import scripts
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 17,
                  color: '#fff',
                }}
              >
                31,468
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 60%)', marginTop: 7 }}>quotes</div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 17,
                  color: '#fff',
                }}
              >
                55,866
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 60%)', marginTop: 7 }}>
                statistics
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 17,
                  color: '#ff6b6b',
                }}
              >
                ~84k
              </div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 60%)', marginTop: 7 }}>
                connections
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '36px 30px 0' }}
      >
        <figure className={styles.fig} style={{ margin: '0 0 34px' }}>
          <div className={styles.figbar}>
            <span className={styles.dot} style={{ background: '#ff6b6b' }} />
            <span className={styles.dot} style={{ background: '#d9a827' }} />
            <span className={styles.dot} style={{ background: '#4ecdc4' }} />
            <span style={{ marginLeft: 8 }}>
              category select — where the retrieval pipeline surfaces
            </span>
          </div>
          <Image
            src={shotCatselect}
            alt="trivai category select: five filled category cards with icons, descriptions and question counts, one empty slot remaining."
            style={{ display: 'block', width: '100%', height: 'auto' }}
            sizes="(max-width: 820px) 100vw, 700px"
          />
          <figcaption className={styles.cap}>
            Every card here is the output of a vector search over the seed tables — type a category,
            the pipeline goes hunting. The token cost breaks down as 4 base + 1 per AI-generated
            category.
          </figcaption>
        </figure>

        <div className={styles.prose}>
          <p style={proseP}>
            All the tricks were removed. We didn&apos;t need them anymore. If the sample happens to
            surface <em>Dog Day Afternoon</em> instead of <em>Taxi Driver</em>, then the question is
            about Dog Day Afternoon. There are still questions about the hits, but now they appear
            at an appropriate ratio. The randomness moved out of the model&apos;s imagination and
            into the database query, where it belonged.
          </p>
          <p style={proseP}>
            This endeavor would grow into the biggest engineering effort of the whole project. The
            &quot;interesting information&quot; half of the system turned out to be almost the whole
            job. Anyone can call a model and ask for trivia questions. Not everyone has a warehouse
            of interesting facts ready to hand it.
          </p>
          <p style={proseP}>
            Instead of requesting variety, the prompt now encodes editorial judgment about what
            makes a question good. As much as things had improved, though, the early-day quirks
            still peeked through. One of the funnier rules was born from a real failure in a real
            game, and the prompt still preserves the crime scene:
          </p>
        </div>
        {/* Akira: expandable crime scene */}
        <details
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <summary
            className={styles.summary}
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              fontSize: 12,
              letterSpacing: '0.08em',
              color: '#d9a827',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background:
                'repeating-linear-gradient(-45deg, rgba(217,168,39,0.07) 0 12px, transparent 12px 24px)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-press-start), monospace', fontSize: 9 }}>▸</span>{' '}
            EXHIBIT 4: THE AKIRA RULE — CRIME SCENE PRESERVED (tap to expand)
          </summary>
          <pre
            style={{
              margin: 0,
              padding: '18px 20px',
              borderTop: '2px solid rgba(255,255,255,0.2)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              lineHeight: 1.85,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`CRITICAL - THE ANSWER MUST NOT APPEAR IN THE QUESTION: not verbatim, not inside
a title, name, or quote the question mentions, and not as an obvious variant or
substring. The most common failure is naming the answer entity while asking for
its name. Example of a BROKEN question: "The 1988 anime film 'Akira' centers on
a secret government experiment - what single word is the name of that
experiment, also the film's title?" - the answer ("Akira") is printed right
there in the question.`}
          </pre>
          <div style={{ padding: '0 20px 14px', fontSize: 11, color: 'hsl(215 20% 55%)' }}>
            trivai-tokens/lib/game/prompts.ts:156 — the current production prompt.
          </div>
        </details>
        <div className={styles.prose}>
          <p style={prosePLast}>
            On several occasions I saw questions where the answer was embedded in the question
            itself. Then when I introduced a rule to try to prevent it, I had to add a counter-rule
            so the AI wouldn&apos;t be coy where it was completely unnecessary (&quot;in the 1984
            film where Soviet troops invade a Colorado town...&quot; instead of just saying Red
            Dawn). There&apos;s now a whole family of rules dedicated to catching answer leakage.
          </p>
        </div>
      </section>

      {/* ============================ ACT 3 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 3" title="multiplayer, the naive way" />
        <div className={styles.prose}>
          <p style={proseP}>
            There isn&apos;t really a limit when it comes to the quality of question generation. I
            had already spent a lot of time on it, and it occurred to me that I had to start
            focusing on other aspects of the project if I wanted to get something released.
            Multiplayer was the feature that intimidated me the most, as I had never built anything
            like it before. It was the beginning of February when I decided to get started.
          </p>
          <p style={proseP}>
            In 48 hours, I had a quick and dirty version. I took the most direct path I could see.
            The game ran in the active player&apos;s browser, and their client broadcast whatever
            happened to everyone else over Pusher.
          </p>
        </div>

        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.25)',
            background: 'hsl(249 23% 7%)',
            padding: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            flexWrap: 'wrap',
            fontSize: 12,
            lineHeight: 2,
          }}
        >
          <div
            style={{
              border: '2px solid #4ecdc4',
              padding: '12px 14px',
              color: '#4ecdc4',
              textAlign: 'center',
            }}
          >
            active player&apos;s
            <br />
            browser
          </div>
          <div style={{ color: 'hsl(215 20% 60%)', textAlign: 'center', fontSize: 11 }}>
            &quot;I got it right,
            <br />
            give me 400 points&quot; →
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.4)',
                padding: '8px 12px',
                color: 'hsl(215 20% 70%)',
              }}
            >
              client 2 · obliges
            </div>
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.4)',
                padding: '8px 12px',
                color: 'hsl(215 20% 70%)',
              }}
            >
              client 3 · obliges
            </div>
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.4)',
                padding: '8px 12px',
                color: 'hsl(215 20% 70%)',
              }}
            >
              client 4 · obliges
            </div>
          </div>
        </div>
        <div className={styles.prose}>
          <p style={prosePLast}>
            The limits of that design are structural. Clients that broadcast state are clients that
            can lie about state. Pusher client events silently fail if a dashboard toggle
            isn&apos;t set. There&apos;s no server-side record of what happened, so every desync
            becomes an archaeology dig. That&apos;s the right trade for a proof of concept, and the
            wrong one for a product — which made the next rewrite a question of when, not whether.
          </p>
        </div>
      </section>

      {/* ============================ INTERLUDE: THE GAP ============================ */}
      <section
        style={{
          position: 'relative',
          margin: '90px 0 0',
          padding: '70px 0 78px',
          background: 'hsl(249 23% 7%)',
          borderTop: '2px solid rgba(255,255,255,0.12)',
          borderBottom: '2px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className={styles.pad} style={{ maxWidth: 760, margin: '0 auto', padding: '0 30px' }}>
          <ActHeader eyebrow="INTERLUDE" title="the three-month gap" eyebrowColor="#4ecdc4" bg="hsl(249 23% 9%)" />
          <div className={styles.prose}>
            <p style={proseP}>
              Then the commits stop for ten weeks. Work got busy, other projects took priority, and
              trivai went on the shelf. It also wasn&apos;t a technical wall I&apos;d hit but a
              design one: the game worked, yet it was missing some key mechanic I couldn&apos;t
              name. I&apos;d tried ideas on and taken them back off — wagering came and went — and
              rather than force it, I let it sit.
            </p>
          </div>
        </div>

        {/* THE CHART */}
        <GapChart padClassName={styles.pad} />

        <div
          className={styles.pad}
          style={{ maxWidth: 760, margin: '40px auto 0', padding: '0 30px' }}
        >
          <div className={styles.prose}>
            <p style={proseP}>
              The version that went quiet was already fun to play, and that mattered more than I
              realized at the time. When I came back, I wasn&apos;t dragging myself back to an
              obligation. I was coming back to a game I missed.
            </p>
            <p style={prosePLast}>
              The comeback commit, dated May 8:{' '}
              <strong style={{ fontWeight: 800, color: '#4ecdc4' }}>&quot;add stealing.&quot;</strong>{' '}
              Apparently three months of not thinking about the problem produced an answer that
              three weeks of staring at it hadn&apos;t: the missing ingredient was offense.
            </p>
          </div>
        </div>
      </section>

      {/* ============================ ACT 4 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 4" title="the reckoning, or rebuilding multiplayer properly" />
        <div className={styles.prose}>
          <p style={proseP}>
            Adding the steal mechanic is what finally broke my patience with the client-driven
            architecture. Steals are adversarial by design: players race to answer after someone
            misses, wrong guesses cost points, and everything hangs on a timing window. Every piece
            of that needs a referee, and &quot;whichever browser broadcasts first&quot; is not a
            referee.
          </p>
          <p style={proseP}>
            It was the January lesson all over again, one layer down: stop patching, rebuild the
            layer. So in late May I wrote up a plan for a clean-cutover, server-authoritative
            rewrite, and over one very tea-fueled stretch, with Claude Code carrying a lot of the
            keystrokes, it landed in seven phases.
          </p>
          <p style={proseP}>
            The heart of it is a pure reducer. The entire game (turns, answering, evaluation,
            steals, reveals) is one state machine:{' '}
            <code style={{ color: '#4ecdc4' }}>reduce(state, action, context)</code> goes in, new
            state comes out. No network calls inside, no database, no randomness. Even the clock
            gets passed in.
          </p>
        </div>
      </section>

      {/* phase machine breakout */}
      <section
        className={styles.pad}
        style={{ maxWidth: 1080, margin: '0 auto', padding: '10px 30px 0' }}
      >
        <div style={{ border: '2px solid rgba(255,255,255,0.25)', background: 'hsl(249 23% 7%)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '16px 20px 0',
            }}
          >
            <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4' }}>
              THE ENGINE&apos;S PHASE MACHINE — one full steal sequence
            </span>
            <span style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>
              9 phases · one pure reducer
            </span>
          </div>
          <PhaseCanvas
            className={styles.phase}
            style={{ display: 'block', width: '100%', height: 400 }}
          />
          <div className={styles.cap}>
            the signal walks the ring in the order a real steal takes:{' '}
            <span style={{ color: '#4ecdc4' }}>
              idle → answering → evaluating → steal_window → steal_answering → steal_evaluating →
              steal_reveal
            </span>
            . the two <span style={{ color: '#ff6b6b' }}>evaluating</span> phases glow coral — those
            are the ones where the engine is waiting on the model.
          </div>
        </div>

        {/* exhibit 6 */}
        <div
          style={{
            marginTop: 20,
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <WindowBar label="trivai-tokens/lib/game/engine.ts:63 — exhibit 6: the phase machine, verbatim" />
          <pre
            style={{
              margin: 0,
              padding: '18px 20px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12.5,
              lineHeight: 1.8,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}
          >
            {`export type EnginePhase =
  | "setup" // MP pre-start: questions are generated but the host hasn't dispatched \`start-game\`
  | "idle" // active player chooses a tile
  | "answering" // a tile is open; awaiting the active player's answer
  | "evaluating" // open-text answer submitted; awaiting the AI verdict
  | "steal_window" // MP: active player was wrong; window open for buzz-in
  | "steal_answering" // MP: a stealer buzzed; awaiting their answer
  | "steal_evaluating" // MP: stealer's answer submitted; awaiting the AI verdict
  | "steal_reveal" // MP: steal sequence done; awaiting the active player's Continue
  | "reveal"; // turn-ending direct answer resolved; awaiting the active player's Continue`}
          </pre>
        </div>
      </section>

      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '36px 30px 0' }}
      >
        <div className={styles.prose}>
          <p style={proseP}>
            And because it&apos;s pure, I can test every gnarly timing edge case on my laptop,
            instead of trying to reproduce it live with two phones and a prayer.
          </p>
          <p style={proseP}>
            Around that reducer sits a transactional harness. Every gameplay action goes through one
            endpoint, which locks the game&apos;s database row, loads the state, asks the reducer
            whether the move is even legal, saves with a version guard, and only broadcasts after
            the commit sticks. If two actions hit the same game at once, the database sorts them
            out. Pusher got demoted from source of truth to messenger; if a broadcast gets lost, the
            state is already safe and clients simply refetch it.
          </p>
          <p style={proseP}>
            And the clients? No longer trusted. The old relay endpoint got locked down to a short
            whitelist of harmless cosmetic events (typing indicators, mostly), and everything that
            carries actual game state now comes from the server. Clients went from being authors of
            the game to being renderers of it.
          </p>
        </div>
        {/* ALLOWED_EVENTS: emptiness is the graphic */}
        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <WindowBar label="app/api/games/[id]/events/route.ts:25 — everything clients are still allowed to say" />
          <pre
            style={{
              margin: 0,
              padding: '44px 20px 58px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 13,
              lineHeight: 2,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`const ALLOWED_EVENTS = new Set<string>([
  PUSHER_EVENTS.ANSWER_SUBMITTED,
  PUSHER_EVENTS.ANSWER_EVALUATED,
  PUSHER_EVENTS.PLAYER_LEFT,
]);`}
          </pre>
          <div style={{ padding: '0 20px 16px', fontSize: 11.5, color: 'hsl(215 20% 55%)' }}>
            three items. everything else comes from the server.
          </div>
        </div>
        <div className={styles.prose}>
          <p style={prosePLast}>
            The trickiest part was AI answer evaluation. The model judges the open-text answers, and
            an API call can take a few seconds; you cannot hold a database lock while a language
            model sits there thinking. So evaluation happens in two phases: lock, note that
            we&apos;re evaluating, unlock. Ask the model with no lock held. Re-lock, make sure the
            game hasn&apos;t moved on without us, and either commit the verdict or toss it. The
            subtle bugs were all timing: at one point the steal window was expiring before anyone
            ever saw it, because the model thought too long.
          </p>
        </div>
      </section>

      {/* ============================ ACT 5 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 5" title="the missing pieces" />
        <div className={styles.prose}>
          <p style={proseP}>
            Stealing had cracked the design wall, but it turned out to be only half the answer.
          </p>
          <p style={proseP}>
            Even stealing had to earn its place first. It entered the game as a chargeable ability,
            a limited resource you spent like a reroll. It kept being the best part of every
            playtest, so it got promoted to a core rule: when someone misses a question, anyone can
            jump in and steal it, one attempt each, with risk as the only limiter. Steal right and
            the points are yours. Steal wrong and you pay the same amount out of your own score.
          </p>
          <p style={proseP}>
            The other half of the answer arrived in June. Traps. On someone else&apos;s turn, you
            quietly arm a tile. The server tells no one but you; the secrecy is enforced by the
            engine itself, not just hidden in the UI. When an opponent opens that tile, it springs
            into a Wildcard with stacking multipliers.
          </p>
        </div>
      </section>

      {/* ring bonus demo breakout */}
      <section
        className={styles.pad}
        style={{ maxWidth: 1080, margin: '0 auto', padding: '10px 30px 0' }}
      >
        <div
          className={styles.cols}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          {/* auto board */}
          <BoardDemo />
          {/* tier ladder + reshuffle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                border: '2px solid rgba(255,255,255,0.25)',
                background: 'hsl(249 23% 7%)',
                padding: 22,
                flex: 1,
              }}
            >
              <div
                style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4', marginBottom: 16 }}
              >
                TRAP × RING — THE MULTIPLIER LADDER
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '9px 12px',
                  }}
                >
                  <span>&lt; 1.5</span>
                  <span style={{ color: 'hsl(215 20% 70%)' }}>base</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid #996515',
                    background: 'rgba(212,160,23,0.12)',
                    padding: '9px 12px',
                  }}
                >
                  <span>1.5 – 2.24</span>
                  <span style={{ color: '#fbbf24' }}>gold</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid #5b4fc7',
                    background: 'rgba(123,104,238,0.12)',
                    padding: '9px 12px',
                  }}
                >
                  <span>2.25 – 3.29</span>
                  <span style={{ color: '#a99bf5' }}>electric</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255,255,255,0.5)',
                    padding: '9px 12px',
                  }}
                >
                  <span>≥ 3.3</span>
                  <span className={styles.prism}>prismatic</span>
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 11.5,
                  lineHeight: 1.8,
                  color: 'hsl(215 20% 60%)',
                }}
              >
                wildcard = floor(base × ringMult × trapMult). max stack: 2.25 × 2.25 ≈{' '}
                <span style={{ color: '#fff', fontWeight: 700 }}>5.06×</span>. steals collect
                trapMult only — momentum stays with the active player.
              </div>
            </div>
            <div
              style={{
                border: '2px solid rgba(255,255,255,0.25)',
                background: 'hsl(249 23% 7%)',
                padding: 22,
              }}
            >
              <div
                style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4', marginBottom: 16 }}
              >
                BOARD RESHUFFLE — perfect-square breakpoints
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '8px 11px' }}>
                  6×6 <span style={{ color: 'hsl(215 20% 55%)' }}>26–36</span>
                </span>
                <span style={{ color: '#ff6b6b' }}>→</span>
                <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '8px 11px' }}>
                  5×5 <span style={{ color: 'hsl(215 20% 55%)' }}>17–25</span>
                </span>
                <span style={{ color: '#ff6b6b' }}>→</span>
                <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '8px 11px' }}>
                  4×4 <span style={{ color: 'hsl(215 20% 55%)' }}>10–16</span>
                </span>
                <span style={{ color: '#ff6b6b' }}>→</span>
                <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '8px 11px' }}>
                  3×3 <span style={{ color: 'hsl(215 20% 55%)' }}>5–9</span>
                </span>
                <span style={{ color: '#ff6b6b' }}>→</span>
                <span style={{ border: '1px solid rgba(255,255,255,0.5)', padding: '8px 11px' }}>
                  2×2 <span style={{ color: 'hsl(215 20% 55%)' }}>1–4</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '36px 30px 0' }}
      >
        <div className={styles.prose}>
          <p style={prosePLast}>
            The board got livelier around them too: bonus multipliers arranged in a ring pattern,
            hot streaks for stringing correct answers together, and a reshuffle mechanic where the
            6×6 grid compacts down to 5×5, then 4×4 as questions run out, with the tile animation
            built by hand because the off-the-shelf animation library and my question modal could
            not agree on timing.
          </p>
        </div>
      </section>

      {/* ============================ ACT 6 ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="ACT 6" title="becoming a product" />
        <div className={styles.prose}>
          <p style={proseP}>
            With traps in place, the game finally felt whole. What remained was the montage phase,
            the unglamorous work that sits between &quot;it works&quot; and &quot;it&apos;s a
            product.&quot; Zod schemas now check every API input, every Pusher payload, every JSON
            column I read back out of my own database, and every AI response.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '0 0 30px', lineHeight: 2 }}>
          <div
            style={{
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '14px 18px',
              background: 'hsl(249 23% 7%)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                fontSize: 15,
                color: '#4ecdc4',
              }}
            >
              574
            </div>
            <div style={{ fontSize: 10.5, color: 'hsl(215 20% 60%)', marginTop: 6 }}>
              tests / 42 files
            </div>
          </div>
          <div
            style={{
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '14px 18px',
              background: 'hsl(249 23% 7%)',
            }}
          >
            <div
              style={{ fontFamily: 'var(--font-press-start), monospace', fontSize: 15, color: '#fff' }}
            >
              51<span style={{ color: 'hsl(215 20% 55%)' }}>/52</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'hsl(215 20% 60%)', marginTop: 6 }}>
              API routes covered
            </div>
          </div>
          <div
            style={{
              border: '2px solid rgba(255,255,255,0.3)',
              padding: '14px 18px',
              background: 'hsl(249 23% 7%)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                fontSize: 15,
                color: '#ff6b6b',
              }}
            >
              4+1
            </div>
            <div style={{ fontSize: 10.5, color: 'hsl(215 20% 60%)', marginTop: 6 }}>
              tokens per game + AI category
            </div>
          </div>
        </div>
        <div className={styles.prose}>
          <p style={proseP}>
            The test suite grew up too. Unit tests had covered the core logic since the early weeks,
            but the montage took things much further: around 574 tests across 42 files, coverage on
            51 of 52 API routes, and Playwright runs that pilot two real browsers through an actual
            multiplayer game over actual Pusher. CI gates every merge, and it has saved me from
            myself more than once.
          </p>
          <p style={proseP}>
            The biggest late addition was <strong style={{ fontWeight: 800 }}>Trivia Studio</strong>.
            For all the work that went into the retrieval corpus, it can never cover the categories
            people most want to play with the people they know: the friend group&apos;s inside
            jokes, the family vacation, your hometown. Studio lets players build their own
            categories by hand and drop them onto the same board, right alongside the AI-generated
            ones. It shipped about a week before launch — tight, but the test suite and the
            server-authoritative engine were what made that call safe to make.
          </p>
        </div>

        <figure className={styles.fig} style={{ margin: '8px 0 34px' }}>
          <div className={styles.figbar}>
            <span className={styles.dot} style={{ background: '#ff6b6b' }} />
            <span className={styles.dot} style={{ background: '#d9a827' }} />
            <span className={styles.dot} style={{ background: '#4ecdc4' }} />
            <span style={{ marginLeft: 8 }}>trivia studio — categories built by hand</span>
          </div>
          <Image
            src={shotStudio}
            alt="Trivia Studio: a grid of user category cards, each showing question counts by point value, a Ready badge and a Play button."
            style={{ display: 'block', width: '100%', height: 'auto' }}
            sizes="(max-width: 820px) 100vw, 700px"
          />
          <figcaption className={styles.cap}>
            Shipped about a week before launch. Hand-built categories cost almost nothing to run
            while AI-generated ones cost real money — which is what broke the old one-token-per-game
            pricing.
          </figcaption>
        </figure>

        <div className={styles.prose}>
          <p style={proseP}>
            Studio also broke the economy, in a good way. Pricing had started as simple as it gets:
            one token per game — which quietly assumed every game costs the same to run. Studio made
            that false: a board of hand-made categories costs me almost nothing, while a board full
            of AI-generated ones costs real money. Rather than guess at a new number, I built the
            instrumentation first. Every generation call logs its token usage, and an admin
            dashboard aggregates cost per game, so I could measure real games and simulated ones
            against each candidate price. The data showed the flat rate was underpricing AI-heavy
            boards, so I refactored the economy to charge for what actually costs money: 4 tokens
            per game, plus 1 for each AI-generated category. That landed before launch, which is the
            whole reason I wanted the measurements — margins are something I can now watch on a
            chart instead of discover on a bill.
          </p>
        </div>
        <div
          style={{
            margin: '8px 0 30px',
            border: '2px solid rgba(255,255,255,0.7)',
            background: 'hsl(249 23% 6%)',
          }}
        >
          <WindowBar label="trivai-tokens/lib/game/generation-version.ts — exhibit 7: the version log (abridged)" />
          <pre
            style={{
              margin: 0,
              padding: '18px 20px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12.5,
              lineHeight: 1.8,
              color: '#a8e6cf',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`// v8: seed-fetch cold-cache mitigation - categories pre-warm Neon's
// local file cache as they land on the board, and the ivfflat indexes
// get REINDEXed to shed bloat.
//
// v9: vector fetch LIMITs cut (100/50 -> 40/30) - beyond reading fewer
// pages, the smaller LIMIT keeps the planner on the ivfflat index for
// mid-size category filters instead of a Bitmap Heap Scan that read
// ~113MB per query (measured: GEOGRAPHY on prod).
export const GENERATION_VERSION = "v9-lean-fetch";`}
          </pre>
        </div>
        <div className={styles.prose}>
          <p style={prosePLast}>
            The same instrumentation carried the last fight before launch: performance. Question
            generation was sometimes fast and sometimes brutally slow, and the culprit wasn&apos;t
            the AI calls but the vector search in front of them; the indexes had outgrown the
            database&apos;s cache, so a cold lookup could eat whole seconds before the AI was even
            invoked. The fixes were pure montage material: quietly pre-warm the cache while the
            player is still picking categories, rebuild the indexes after bulk updates, and fetch
            less so the query planner doesn&apos;t wander off the index. Every attempt got a version
            tag stamped onto its cost and latency rows, which turned &quot;I think it&apos;s faster
            now&quot; into an actual chart.
          </p>
        </div>
      </section>

      {/* ============================ LAUNCH ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 0' }}
      >
        <ActHeader eyebrow="LAUNCH" title="July 11, 2026" eyebrowColor="#4ecdc4" />
        <div className={styles.prose}>
          <p style={proseP}>
            trivai went public on July 11, 2026, with live Stripe payments. Six months and 1,021
            commits after a prompt asked Claude to roll imaginary dice.
          </p>
          <p style={proseP}>
            Since then: GDPR data export and erasure, an in-app feedback system, and a whole new
            respect for the deploy button now that real people&apos;s money is on the line.
          </p>
          <p style={prosePLast}>
            And the sound came back. The corny soundtrack didn&apos;t survive the rewrite, but in
            late July the game finally got a proper soundscape:{' '}
            <strong style={{ fontWeight: 800 }}>29 sound effects</strong>, all AI-generated from
            written prompts and tuned by ear against the game&apos;s real animations. It turns out
            describing a sound in words is its own strange adventure — the best prompt I wrote asked
            for a whoosh <em>&quot;like an owl landing&quot;</em> — but that story deserves a post
            of its own. The womp-womp horns didn&apos;t make the cut. Their spirit lives on.
          </p>
        </div>
      </section>

      {/* timeline strip */}
      <section
        className={styles.pad}
        style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 30px 0' }}
      >
        <div
          style={{
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'hsl(249 23% 7%)',
            padding: '26px 24px 20px',
            overflowX: 'auto',
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#4ecdc4', marginBottom: 26 }}>
            SIX MONTHS, FIFTEEN MILESTONES
          </div>
          <div style={{ position: 'relative', minWidth: 1020, padding: '48px 54px 96px' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: 2,
                background: 'linear-gradient(90deg,#ff6b6b,#4ecdc4)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {MILESTONES.map((m) => (
                <div
                  key={m.date}
                  style={{ position: 'relative', width: 12, display: 'flex', justifyContent: 'center' }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      background: m.dot,
                      transform: 'rotate(45deg)',
                      marginTop: -4,
                      position: 'relative',
                      top: '50%',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: m.top,
                      width: 96,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      fontSize: 9.5,
                      lineHeight: 1.5,
                      color: 'hsl(215 20% 62%)',
                      whiteSpace: 'normal',
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 700 }}>{m.date}</span>
                    <br />
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ LESSONS ============================ */}
      <section
        className={styles.pad}
        style={{ maxWidth: 760, margin: '0 auto', padding: '80px 30px 90px' }}
      >
        <div style={{ border: '2px solid rgba(255,255,255,0.7)', background: 'hsl(249 23% 6%)' }}>
          <WindowBar label="dylan@portfolio — ~ — zsh" />
          <div style={{ padding: '22px 24px', fontSize: 14.5, lineHeight: 2 }}>
            <div style={{ color: '#4ecdc4', marginBottom: 18 }}>
              $ cat lessons.md{' '}
              <span style={{ color: 'hsl(215 20% 55%)' }}>
                # what I&apos;d tell you if you&apos;re building something like this
              </span>
            </div>
            <p style={{ margin: '0 0 22px', color: 'hsl(210 40% 94%)' }}>
              <strong style={{ fontWeight: 800, color: '#fff' }}>
                Prompts are a prototype tool. Retrieval is an architecture.
              </strong>{' '}
              If you find yourself writing ever-sterner instructions to make a model act against its
              own instincts, that&apos;s the system telling you the knowledge belongs outside the
              model. No amount of rewording gets you there; a database does.
            </p>
            <p style={{ margin: '0 0 22px', color: 'hsl(210 40% 94%)' }}>
              <strong style={{ fontWeight: 800, color: '#fff' }}>
                Shortcuts are loans, so know the interest rate going in.
              </strong>{' '}
              Letting the clients run the game got multiplayer working in 48 hours, and that version
              taught me what the game needed. But anything a client can broadcast, a client can
              fake, and there was no server-side record to debug against. I&apos;d take that loan
              again to learn the shape of the thing — I&apos;d just plan the rewrite into the
              schedule from the start.
            </p>
            <p style={{ margin: '0 0 22px', color: 'hsl(210 40% 94%)' }}>
              <strong style={{ fontWeight: 800, color: '#fff' }}>
                The model is a trust boundary.
              </strong>{' '}
              Validate AI output like it&apos;s hostile user input, because structurally that&apos;s
              exactly what it is: text from outside your system that you&apos;re about to act on.
            </p>
            <p style={{ margin: '0 0 22px', color: 'hsl(210 40% 94%)' }}>
              <strong style={{ fontWeight: 800, color: '#fff' }}>The dataset is the product.</strong>{' '}
              The engine had to be right, and getting it right took a full rewrite. But it&apos;s
              the 188,000 curated, embedded, cross-linked records that make the questions worth
              answering, and building that corpus took more sustained effort than any code in the
              repo.
            </p>
            <p style={{ margin: '0 0 26px', color: 'hsl(210 40% 94%)' }}>
              <strong style={{ fontWeight: 800, color: '#fff' }}>
                Instrument before you optimize, and version your experiments.
              </strong>{' '}
              A one-line version constant made every generation experiment comparable against real
              production data.
            </p>
            <div style={{ color: '#4ecdc4' }}>
              $ open{' '}
              <a
                href="https://trivai.games"
                style={{ color: '#4ecdc4', textDecoration: 'underline' }}
              >
                trivai.games
              </a>{' '}
              <span style={{ color: 'hsl(215 20% 55%)' }}># see for yourself</span>
            </div>
            <div style={{ marginTop: 8, color: '#4ecdc4' }}>
              $ <span className={styles.caret} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const MILESTONES = [
  { date: 'Jan 10', label: 'first commit', dot: '#ff6b6b', top: '-30px' },
  { date: 'Jan 14', label: 'new repo', dot: '#ff6b6b', top: '44px' },
  { date: 'Jan 15', label: 'vector search', dot: '#ff6b6b', top: '-30px' },
  { date: 'Jan 27', label: 'first tests', dot: '#ff6b6b', top: '44px' },
  { date: 'Feb 1', label: 'multiplayer', dot: '#ff6b6b', top: '-30px' },
  { date: 'Feb 6', label: 'fuzzy match out', dot: '#ff6b6b', top: '44px' },
  { date: 'Feb 7', label: 'wagering trials', dot: '#ff6b6b', top: '-30px' },
  { date: 'Feb 24', label: 'the gap begins', dot: '#ff6b6b', top: '44px' },
  { date: 'May 8', label: "'add stealing'", dot: '#4ecdc4', top: '-30px' },
  { date: 'May 31', label: 'server rewrite', dot: '#4ecdc4', top: '44px' },
  { date: 'Jun 6', label: 'board reshuffle', dot: '#4ecdc4', top: '-30px' },
  { date: 'Jun 21', label: 'traps ship', dot: '#4ecdc4', top: '44px' },
  { date: 'Jul 3', label: 'Trivia Studio', dot: '#4ecdc4', top: '-30px' },
  { date: 'Jul 11', label: 'public launch', dot: '#4ecdc4', top: '44px' },
  { date: 'Jul 14', label: 'perf fixes v8/v9', dot: '#4ecdc4', top: '-30px' },
]
