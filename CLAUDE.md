# CLAUDE.md

## Commands

- `npm run dev` — Start development server (Next.js on localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture

Next.js 16 App Router, TypeScript, Tailwind CSS v4, React 19. Path alias `@/*` → `./src/*`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Game orchestrator — state, data fetching, game logic callbacks
│   ├── layout.tsx        # Root layout (Inter + JetBrains Mono fonts, metadata)
│   └── globals.css       # CSS variables, Tailwind, component styles (.card, .submit-btn, etc.)
├── components/
│   ├── GameHeader.tsx    # Score, progress counter (Q X / Y), confidence selector, timer
│   ├── QuestionCard.tsx  # Question text, lower/upper bound inputs, submit button
│   ├── FeedbackCard.tsx  # Hit/miss result, true answer, points earned, user's interval
│   └── GameOver.tsx      # Final score screen with play-again button
└── lib/
    ├── types.ts          # Shared types: FermiQuestion, GamePhase, FeedbackData
    ├── utils.ts          # shuffleArray, formatExponent, formatAnswer
    ├── parseAnswer.ts    # Parse messy answer strings to numeric values + extract units
    └── scoring.ts        # calculateScore — confidence multipliers, tightness bonus, miss penalty

public/
└── fermidata.json        # 557 Fermi estimation questions (filtered to ~valid numeric answers)
```

## Game Flow

1. On mount: fetch `fermidata.json`, filter valid answers, shuffle all questions, start playing immediately
2. **playing** — user picks confidence (50–90%), enters lower/upper bound exponents (10^X), submits or timer auto-submits at 0s
3. **feedback** — shows hit/miss, true answer, points delta
4. Repeat until all questions answered → **end** screen
5. "Play Again" reshuffles all questions and restarts

## Scoring

- Hit: `BASE_POINTS (100) × confidence_multiplier × tightness_bonus`
- Miss: negative penalty scaled by confidence (50% = −20, 90% = −100)
- Tighter intervals score more points when hit

## Important

- **Always update [branch-analysis.md](branch-analysis.md) after making any change** — it tracks what has been modified and serves as a reasoning scratchpad
