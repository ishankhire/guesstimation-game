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
