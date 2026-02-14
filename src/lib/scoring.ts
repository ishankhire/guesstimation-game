export type ConfidenceLevel = 50 | 60 | 70 | 80 | 90;

interface ScoreResult {
    points: number;
    hit: boolean;
    trueExponent: number;
}

// Parameters from Greenberg (2018), Section 9.4
const SMAX = 10;
const SMIN = -57.26893683880667; // -(10 * log(99/50)) / log(50)
const DELTA = 0.4;
const C = Math.log(100); // ln(100) ≈ 4.60517, for Order of Magnitude rule

/**
 * Order of Magnitude scoring rule from Greenberg (2018).
 *
 * Implements the final Smag rule (Section 9.3) which applies:
 *   1. Interval expansion by factor delta (multiplicative for OoM)
 *   2. Score floor at smin
 *
 * The core formula (Section 9.1.2 / 9.2):
 *   - x inside [L,U]:  4 * smax * (r*t / s²) * (1 - s/(1+s))
 *   - x below L:       (-2/(1-beta)) * r  -  (r/(1+r)) * s
 *   - x above U:       (-2/(1-beta)) * t  -  (t/(1+t)) * s
 *
 * where for Order of Magnitude:
 *   r = ln(L/x) / c   (when x < L)  or  ln(x/L) / c  (when x inside)
 *   s = ln(U/L) / c
 *   t = ln(x/U) / c   (when x > U)  or  ln(U/x) / c  (when x inside)
 *
 * @param x          - the true answer (positive real number)
 * @param L          - user's lower bound (positive real number)
 * @param U          - user's upper bound (positive real number, U > L)
 * @param beta       - confidence level as a fraction (e.g. 0.8 for 80%)
 */
function scoreOrderOfMagnitude(
    x: number,
    L: number,
    U: number,
    beta: number,
): number {
    // Step 1: Expand the interval (multiplicative for OoM rule)
    const Lexp = L * (1 - DELTA);
    const Uexp = U * (1 + DELTA);

    // Step 2: Compute s (interval width in log-space)
    const s = Math.log(Uexp / Lexp) / C;

    // Step 3: Score based on where x falls
    let raw: number;

    if (x < Lexp) {
        const r = Math.log(Lexp / x) / C;
        raw = (-2 / (1 - beta)) * r - (r / (1 + r)) * s;
    } else if (x > Uexp) {
        const t = Math.log(x / Uexp) / C;
        raw = (-2 / (1 - beta)) * t - (t / (1 + t)) * s;
    } else {
        // x is inside the expanded interval
        const r = Math.log(x / Lexp) / C;
        const t = Math.log(Uexp / x) / C;
        raw = 4 * SMAX * (r * t) / (s * s) * (1 - s / (1 + s));
    }

    // Step 4: Clamp to floor
    return Math.max(raw, SMIN);
}

/**
 * Calculate score for a single question.
 *
 * @param confidence - selected confidence level (50–90%)
 * @param lowerExp   - user's lower bound exponent (the X in 10^X)
 * @param upperExp   - user's upper bound exponent
 * @param trueExp    - log10 of the true answer
 */
export function calculateScore(
    confidence: ConfidenceLevel,
    lowerExp: number,
    upperExp: number,
    trueExp: number
): ScoreResult {
    // Convert exponents to actual values for the OoM formula
    const L = Math.pow(10, lowerExp);
    const U = Math.pow(10, upperExp);
    const x = Math.pow(10, trueExp);

    // Ensure L < U; if equal or inverted, swap or add small gap
    const actualL = Math.min(L, U);
    const actualU = Math.max(L, U);

    // Beta = confidence as fraction
    const beta = confidence / 100;

    // "Hit" = true answer inside user's original (non-expanded) interval
    const hit = trueExp >= Math.min(lowerExp, upperExp)
             && trueExp <= Math.max(lowerExp, upperExp);

    // Handle edge case: L === U (zero-width interval)
    let points: number;
    if (actualL === actualU) {
        // Degenerate interval — use a tiny spread
        const tiny = actualL * 0.001;
        points = scoreOrderOfMagnitude(x, actualL - tiny, actualU + tiny, beta);
    } else {
        points = scoreOrderOfMagnitude(x, actualL, actualU, beta);
    }

    // Round to 2 decimal places for display
    points = Math.round(points * 100) / 100;

    return { points, hit, trueExponent: trueExp };
}
