# Branch Analysis

Scratchpad for tracking changes made to the codebase. Update this file after every change.

---

## 2026-02-14

### Remove start screen, use all questions, add progress counter, refactor page.tsx

**Motivation:** The opening splash screen was unnecessary friction. The 10-question cap was arbitrary given 557 available questions. page.tsx at 415 lines was doing too much in one place.

**Changes:**

- `src/app/page.tsx` — Rewritten as a lean orchestrator (~185 lines). Removed `"start"` phase and `QUESTIONS_PER_GAME` constant. Game now begins immediately on data load. `nextQuestion` checks against `gameQuestions.length` instead of a hardcoded limit. Added `"loading"` phase for initial fetch state.

- `src/components/GameHeader.tsx` — New. Score, progress counter ("Question X / Y"), confidence selector, timer.

- `src/components/QuestionCard.tsx` — New. Question text, lower/upper bound inputs, submit button.

- `src/components/FeedbackCard.tsx` — New. Hit/miss result card with true answer, points, and user's interval.

- `src/components/GameOver.tsx` — New. Final score screen. Max possible score now scales with `totalQuestions * 200`.

- `src/lib/types.ts` — New. Shared types: `FermiQuestion`, `GamePhase` (`"loading" | "playing" | "feedback" | "end"`), `FeedbackData`.

- `src/lib/utils.ts` — New. Utility functions extracted from page.tsx: `shuffleArray`, `formatExponent`, `formatAnswer`.

**Files unchanged:** `parseAnswer.ts`, `scoring.ts`, `globals.css`, `layout.tsx`

---

### Replace ad-hoc scoring with Order of Magnitude rule (Greenberg 2018)

**Motivation:** The original scoring was a simple hit/miss system with arbitrary confidence multipliers and penalties. Replaced with the Order of Magnitude prediction interval scoring rule from Greenberg (2018) "Calibration Scoring Rules for Practical Prediction Training" — a well-designed rule for Fermi-style questions that span many orders of magnitude.

**Key formula (Section 9.1.2 / 9.2 / 9.3):**
- x inside expanded [L,U]: `4 * smax * (r*t/s²) * 1/(1+s)` — parabolic, rewards centering and precision
- x outside: `(-2/(1-β)) * miss_dist - (miss_dist/(1+miss_dist)) * s` — penalizes distance, scaled by confidence
- Variables r, s, t use log-ratios (OoM rule), c = ln(100) ≈ 4.605
- Interval expanded by δ=0.4 (multiplicative) before scoring, so boundary hits get small positive score
- Score clamped to smin = -57.269 floor

**Adaptation for this game:** β (confidence) is not fixed at 0.8 — it varies with user's selected confidence level (50–90%), so the miss penalty coefficient -2/(1-β) naturally scales: higher confidence = harsher miss penalty.

**Parameters:** smax=10, smin=-57.269, δ=0.4, c=ln(100)

**Changes:**

- `src/lib/scoring.ts` — Complete rewrite. Removed ad-hoc CONFIDENCE_MULTIPLIER/MISS_PENALTY tables and BASE_POINTS. Implemented `scoreOrderOfMagnitude()` (the core OoM formula) and updated `calculateScore()` to convert exponents to actual values, compute β from confidence, and round to 2 decimal. Score range is now [-57.3, +10] per question instead of [-100, ~2000].

- `src/components/GameOver.tsx` — Changed `maxPossible` from `totalQuestions * 200` to `totalQuestions * 10` (smax=10).

- `src/components/GameHeader.tsx'`

**Files unchanged:** `page.tsx` (API unchanged — `calculateScore` still takes same args), `FeedbackCard.tsx`, `QuestionCard.tsx`, `types.ts`, `parseAnswer.ts`, `utils.ts`

---

### Add LLM question generation pipeline

**Motivation:** Questions currently come from a static `fermidata.json` sourced from a GitHub repo. Added a standalone Node.js script that uses the Anthropic API with web search to generate high-quality, source-backed estimation questions. Separate from the Next.js app code since it's a build-time utility, not a runtime dependency.

**Changes:**

- `scripts/generate-questions/generate-questions.js` — New. Node.js script that calls Claude (claude-sonnet-4-5-20250929) with web search enabled to generate Fermi estimation questions in batches of 5. Includes: exponential backoff retry logic, JSON extraction with fallback parsing, schema validation, deduplication, incremental JSONL output, and final `questions.json` assembly. Configurable total via CLI arg (default 100).

- `scripts/generate-questions/prompt-template.txt` — New. System prompt instructing Claude to only use web-searched data from authoritative sources (Our World in Data, World Bank, etc.). Defines 8 question categories, 3 difficulty levels, output JSON schema, and includes 10 example questions spanning different categories.

- `package.json` — Added `@anthropic-ai/sdk` dependency.

**New question schema** (different from existing `fermidata.json`):
```json
{ "id", "question", "units", "answer" (numeric), "source_text", "source_url", "category", "year", "difficulty" }
```

**Usage:** `ANTHROPIC_API_KEY=... node scripts/generate-questions/generate-questions.js [N]`

**Files unchanged:** All `src/` files, `public/fermidata.json`

---

### Switch game to use generated questions.json with source attribution

**Motivation:** Replace the old `fermidata.json` (string answers, no sources) with the new AI-generated `questions.json` (numeric answers, units, source text/URL). Show source attribution on the feedback screen after answering.

**Changes:**

- `src/lib/types.ts` — `FermiQuestion.answer` changed from `string` to `number`. Added fields: `units`, `source_text`, `source_url`, `category`, `year`, `difficulty`. `FeedbackData` updated to include `units`, `source_text`, `source_url` and `rawAnswer` changed from `string` to `number`.

- `src/lib/parseAnswer.ts` — Simplified. Removed `parseAnswerRaw` and `extractUnit` (no longer needed since answers are numeric and units are a separate field). `answerToExponent` now takes `number` directly.

- `src/lib/utils.ts` — `formatAnswer` now takes `number` instead of `string`. Removed `parseAnswerRaw` import.

- `src/app/page.tsx` — Fetches `/questions.json` instead of `/fermidata.json`. Removed `parseAnswerRaw`/`extractUnit` imports. Validation simplified to `!isNaN(q.answer) && q.answer > 0`. Unit extracted from `currentQuestion.units`. FeedbackData now includes `units`, `source_text`, `source_url`.

- `src/components/FeedbackCard.tsx` — Shows units next to the true answer. Added source section below the interval display: source text and a clickable source URL link.

- `public/questions.json` — New. Copied from `scripts/generate-questions/questions.json`.

**Files unchanged:** `scoring.ts`, `globals.css`, `layout.tsx`, `GameHeader.tsx`, `QuestionCard.tsx`, `GameOver.tsx`

---

### Adaptive input UI: plain numbers for normal-range questions, scientific notation for extreme

**Motivation:** Entering `10^X` exponents for questions like "How many countries are in the UN?" (answer: 193) is clumsy. For answers in the normal range (0.01–9,999), a plain number input is more natural. Scientific notation is only useful for very large/small answers.

**Rules:**
- If answer exponent is in `[-2, 4]` (i.e. answer between 0.01 and 9,999): plain number input per bound, no prefix.
- Otherwise: two inputs per bound — `a` (decimal coefficient) and `b` (integer exponent), representing `a × 10^b`. The `b` field rejects decimals with an inline error message.

**Changes:**

- `src/components/QuestionCard.tsx` — Refactored. New internal `BoundInput` component handles both modes. In scientific mode, renders two `<input>` elements with a `× 10^` label between them. Integer validation for the exponent field: shows "Exponent must be an integer" error on decimal input.

- `src/app/page.tsx` — Added state for plain bounds (`lowerPlain`, `upperPlain`) and scientific bounds (`lowerCoeff`, `lowerExp`, `upperCoeff`, `upperExp`) plus error strings. Added `isScientificMode()` helper (mirrors `DISTANCE_EXP_MIN/MAX` from scoring). `canSubmit` logic varies by mode. `handleSubmit` converts inputs to actual values, then to `log10` for scoring. Added `submittedLower`/`submittedUpper`/`submittedScientific` state to pass actual numeric bounds to FeedbackCard.

- `src/components/FeedbackCard.tsx` — Prop change: replaced `lowerBound: string` / `upperBound: string` with `lowerValue: number | null` / `upperValue: number | null` / `useScientific: boolean`. Interval display uses `toExponential(2)` in scientific mode, `formatAnswer` in plain mode.

**Files unchanged:** `scoring.ts`, `parseAnswer.ts`, `utils.ts`, `types.ts`, `globals.css`, `layout.tsx`, `GameHeader.tsx`, `GameOver.tsx`

---

### Add dual scoring: Distance rule for normal magnitudes, OoM for extreme

**Motivation:** With the new `questions.json`, answers span from 1 to 1.7×10^14. Questions with "normal" answers (e.g. 54 countries, 98.6°F) are poorly served by the OoM rule since linear differences are more meaningful at that scale. The Distance rule (Greenberg 2018, Section 9.1.1) is designed for exactly this case.

**Answer distribution analysis:**
- 10^0 to 10^2: 69 questions (58%) — normal range (countries, temperatures, percentages)
- 10^3 to 10^5: 6 questions — moderate
- 10^6+: 45 questions — large (populations, budgets, distances)

**Rule selection threshold:** `trueExp ∈ [-2, 4]` → Distance rule; otherwise → OoM rule. This covers answers from 0.01 to 9,999.

**Distance rule (Section 9.1.1):**
- r, s, t are linear differences divided by c=100
- Interval expansion is additive: L−δ, U+δ (δ=0.4)
- Same core piecewise formula as OoM (Section 9.2)
- Same smax=10, smin=−57.269 floor (Section 9.3/9.4)

**Changes:**

- `src/lib/scoring.ts` — Added `scoreDistance()` function (linear r/s/t, c=100, additive expansion). Split `C` constant into `C_DISTANCE=100` and `C_OOM=ln(100)`. Added `DISTANCE_EXP_MIN=-2` and `DISTANCE_EXP_MAX=4` threshold constants. `calculateScore()` now checks `trueExp` against threshold to select rule.

**Files unchanged:** All other files — `calculateScore` API signature unchanged

---

### Add Elo-style rating system

**Motivation:** Raw cumulative score is hard to interpret across sessions. Added a rating system (0–10000, starting at 1000) that updates after each question, giving players a persistent skill indicator. The update is monotonically increasing in score, preserving the honesty incentive from the proper scoring rules.

**Formula:** `R_new = clamp(R + K(R) * (n(score) - E(R)), 0, 10000)` where:
- `n(score) = 1 / (1 + exp(-score/4))` — sigmoid normalization of raw score to (0,1)
- `E(R) = R / (R + 1000)` — expected normalized score at current rating
- `K(R) = 100 / (1 + R/5000)` — gain factor, larger at low ratings for fast convergence

**Rating scale:** ~1000 = beginner (break even), ~2000 = average, ~4000 = good, ~7000 = outstanding, ~10000 = theoretical ceiling.

**Changes:**

- `src/lib/rating.ts` — New. Exports `normalizeScore`, `expectedScore`, `gainFactor`, `updateRating`, `INITIAL_RATING`.

- `src/lib/rating.test.ts` — New. 27 vitest tests covering component functions, monotonicity (honesty incentive), clamping, convergence, and equilibrium points.

- `src/lib/types.ts` — Added `ratingDelta: number` to `FeedbackData`.

- `src/app/page.tsx` — Added `rating` state (initialized to `INITIAL_RATING`). `handleSubmit` calls `updateRating` and passes `ratingDelta` into `FeedbackData`. Reset on play-again. Passes `rating` to `GameHeader` and `GameOver`.

- `src/components/GameHeader.tsx` — Rating displayed prominently (large text), cumulative score shown smaller below. Added `rating` prop.

- `src/components/FeedbackCard.tsx` — Shows rating delta below points (e.g. "Rating +27.3" or "Rating -14.1").

- `src/components/GameOver.tsx` — Final screen shows rating (with progress bar out of 10000) instead of raw score. Added `rating` prop.

- `package.json` — Added `vitest` dev dependency.

**Files unchanged:** `scoring.ts`, `parseAnswer.ts`, `utils.ts`, `QuestionCard.tsx`, `globals.css`, `layout.tsx`

---

### Add Google sign-in, username system, and persistent rating

**Motivation:** Rating was in-memory only — lost on page refresh. Added Google OAuth for user accounts, a username selection flow (4–17 chars, alphanumeric + underscores), and database-backed rating persistence. Anonymous play remains supported (no sign-in required).

**Tech stack additions:** NextAuth.js v5 (Auth.js) for Google OAuth, Prisma v5 ORM with `@auth/prisma-adapter`, Supabase (hosted PostgreSQL).

**Database schema:** `User` model with NextAuth fields plus custom `username` (String?, unique), `rating` (Float, default 1000), `questionsPlayed` (Int, default 0). Plus standard NextAuth `Account`, `Session`, `VerificationToken` models.

**Changes:**

- `prisma/schema.prisma` — New. Database schema with User (including username, rating, questionsPlayed), Account, Session, VerificationToken models.

- `src/lib/db.ts` — New. Prisma client singleton (avoids multiple instances in dev).

- `src/lib/auth.ts` — New. NextAuth v5 config with Google provider, PrismaAdapter, session callback that enriches session with `username` and `rating`. Type augmentation for `Session`.

- `src/app/api/auth/[...nextauth]/route.ts` — New. NextAuth catch-all route handler.

- `src/app/api/user/username/route.ts` — New. POST endpoint: validates username (4–17 chars, `/^[a-zA-Z0-9_]+$/`), checks uniqueness, saves to DB.

- `src/app/api/user/rating/route.ts` — New. POST endpoint: accepts `{ rating, questionsPlayed }`, validates, updates DB.

- `src/app/api/user/me/route.ts` — New. GET endpoint: returns `{ username, rating, questionsPlayed }` for authenticated user.

- `src/app/auth/signin/page.tsx` — New. Sign-in page with Google button and "Play without signing in" link.

- `src/app/username/page.tsx` — New. Username selection form with real-time validation, shown after first Google sign-in.

- `src/components/SessionProvider.tsx` — New. Client wrapper for NextAuth's SessionProvider.

- `src/middleware.ts` — New. Route protection: redirects authenticated users without username to `/username`. Allows anonymous users through.

- `.env.local` — New (gitignored). Template for DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.

- `src/app/layout.tsx` — Wrapped children with `<SessionProvider>`.

- `src/app/page.tsx` — Added `useSession` hook, loads persisted rating from `/api/user/me` on mount for authenticated users, saves rating to DB (fire-and-forget) after each question submission. "Play Again" no longer resets rating. Passes `username` and `isAuthenticated` to GameHeader and GameOver.

- `src/components/GameHeader.tsx` — Added `username` and `isAuthenticated` props. Displays username above rating, sign-out button for authenticated users.

- `src/components/GameOver.tsx` — Added `username`, `isAuthenticated`, `onSignIn` props. Shows username, "Sign in to save your progress" for anonymous users, sign-out for authenticated.

- `src/lib/types.ts` — Added `UserData` interface.

- `package.json` — Added `next-auth@beta`, `@auth/prisma-adapter`, `@prisma/client`, `prisma` (dev).

**Files unchanged:** `scoring.ts`, `rating.ts`, `rating.test.ts`, `parseAnswer.ts`, `utils.ts`, `QuestionCard.tsx`, `FeedbackCard.tsx`, `globals.css`

---

### UI redesign: dark theme, new fonts, rearranged layout, confidence level change

**Motivation:** Visual refresh to give the game a more distinct, modern look. Moved away from the clinical white/indigo design to a dark, warm aesthetic.

**Design changes:**
- **Fonts:** Inter → Space Grotesk (display), JetBrains Mono → IBM Plex Mono (data/numbers)
- **Color scheme:** White background → dark charcoal (#0f1117), indigo accent → warm amber/gold (#e5a83b), matching dark surfaces and borders throughout
- **Layout:** GameHeader restructured from 3-column spread to compact 2-row bar (Rating/Question/Timer on row 1, Confidence/Score/Auth on row 2)
- **Components:** Pill-shaped buttons and tabs (border-radius: 999px), rounded card corners (12px), colored left-border on feedback cards (green/red), focus-within highlight on inputs, uppercase tracking-wider labels
- **Confidence levels:** Changed from 5 options [50, 60, 70, 80, 90] to 3 options [60, 75, 90]

**Changes:**

- `src/app/layout.tsx` — Swapped Inter/JetBrains_Mono imports to Space_Grotesk/IBM_Plex_Mono
- `src/app/globals.css` — Complete rewrite of CSS variables (dark palette) and all component classes (pill shapes, dark surfaces, focus states)
- `src/lib/scoring.ts` — ConfidenceLevel type changed from `50 | 60 | 70 | 80 | 90` to `60 | 75 | 90`
- `src/app/page.tsx` — Default confidence changed from 80 to 75
- `src/components/GameHeader.tsx` — Rearranged to 2-row layout, confidence levels reduced to [60, 75, 90], compact auth UI
- `src/components/QuestionCard.tsx` — Larger question text (3xl/4xl), uppercase labels, accent-colored heading
- `src/components/FeedbackCard.tsx` — Colored left border instead of circle icon, uppercase section labels, surface-light backgrounds
- `src/components/GameOver.tsx` — Larger rating display (6xl), thicker progress bar, transition-colors on links
- `src/components/Leaderboard.tsx` — Uppercase headers, amber accent on rating column, updated highlight color
- `src/components/TabHeader.tsx` — No structural change (pill styling handled by globals.css)

**Files unchanged:** `scoring.ts` (only type change), `rating.ts`, `rating.test.ts`, `parseAnswer.ts`, `utils.ts`, `types.ts`, all API routes, `middleware.ts`, `SessionProvider.tsx`
