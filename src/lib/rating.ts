const INITIAL_RATING = 1000;
const MAX_RATING = 10000;
const MIN_RATING = 0;

/**
 * Sigmoid normalization of raw score to (0, 1).
 * Maps the scoring range (~-57 to ~10) into a probability-like value.
 */
export function normalizeScore(score: number): number {
  return 1 / (1 + Math.exp(-score / 4));
}

/**
 * Expected normalized score at a given rating.
 * Rises steeply at low ratings, flattens at high ratings.
 * R=1000 → ~0.5, R=2000 → ~0.67, R=4000 → ~0.8, R=7000 → ~0.875, R=10000 → ~0.91
 */
export function expectedScore(rating: number): number {
  return rating / (rating + 1000);
}

/**
 * Gain factor K that decreases at higher ratings.
 * ~100 at R=0, ~83 at R=1000, ~50 at R=5000, ~33 at R=10000.
 */
export function gainFactor(rating: number): number {
  return 100 / (1 + rating / 5000);
}

/**
 * Update a player's rating after a single question.
 *
 * R_new = clamp(R + K(R) * (n(score) - E(R)), 0, 10000)
 *
 * The update is monotonically increasing in score at every rating level:
 * sigmoid is always increasing, K(R) is always positive, so higher raw score
 * always produces a larger rating gain (or smaller loss). This preserves the
 * honesty incentive from the underlying proper scoring rules.
 */
export function updateRating(currentRating: number, score: number): number {
  const n = normalizeScore(score);
  const E = expectedScore(currentRating);
  const K = gainFactor(currentRating);

  const newRating = currentRating + K * (n - E);
  return Math.round(Math.max(MIN_RATING, Math.min(MAX_RATING, newRating)) * 100) / 100;
}

export { INITIAL_RATING };
