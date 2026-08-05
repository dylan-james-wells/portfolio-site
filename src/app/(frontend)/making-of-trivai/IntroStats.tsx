'use client'

/* The intro paragraph's live counters. Fetches trivai's public stats endpoint
   and swaps in current values; silently keeps the static fallbacks on any
   error. The Launch section's numbers are NOT counters — hardcoded forever. */

import React, { useEffect, useState } from 'react'

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
]

export const IntroStats: React.FC = () => {
  const [stats, setStats] = useState({
    months: 'Six months',
    commits: '1,021',
    records: '188,000',
  })

  useEffect(() => {
    fetch('https://trivai.games/api/stats/making-of')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s) return
        const start = new Date(s.startedAt),
          now = new Date()
        let months =
          (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
        if (now.getDate() < start.getDate()) months -= 1
        setStats((prev) => {
          const upd = { ...prev }
          if (months >= 1 && months <= 20)
            upd.months =
              WORDS[months].charAt(0).toUpperCase() +
              WORDS[months].slice(1) +
              (months === 1 ? ' month' : ' months')
          if (typeof s.commits === 'number') upd.commits = s.commits.toLocaleString('en-US')
          if (typeof s.seeds === 'number' && typeof s.triviaSeeds === 'number')
            upd.records = (Math.floor((s.seeds + s.triviaSeeds) / 1000) * 1000).toLocaleString(
              'en-US',
            )
          return upd
        })
      })
      .catch(() => {})
  }, [])

  return (
    <p style={{ margin: 0 }}>
      <span data-trivai-stat="months">{stats.months}</span>,{' '}
      <span data-trivai-stat="commits">{stats.commits}</span> commits, and a small ocean of tea
      later, trivai is a live multiplayer trivia game with a{' '}
      <span data-trivai-stat="records">{stats.records}</span>-record retrieval pipeline behind it,
      fueling a question generation engine that never stops surprising me as I continue to improve
      it. Its creation story is one of trial and error: systems that stood for weeks or months
      before being torn down and rebuilt, each teardown leaving behind a lesson that still shapes
      the game today. The liberating part was learning to recognize when it&apos;s time to stop
      patching and rethink the approach.
    </p>
  )
}
