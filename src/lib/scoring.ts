export type ConfidenceLevel = 60 | 75 | 90;

interface ScoreResult {
    points: number;
    hit: boolean;
    trueExponent: number;
}

// Parameters from Greenberg (2018), Section 9.4
const SMAX = 10;
const SMIN = -57.26893683880667; // -(10 * log(99/50)) / log(50)
const DELTA = 0.4;
const C_DISTANCE = 100;              // c for Distance rule (Section 9.1.1)
const C_OOM = Math.log(100);         // c for Order of Magnitude rule (Section 9.1.2), ln(100) ≈ 4.605

// Use Distance rule when answer exponent is in this range; OoM otherwise
const DISTANCE_EXP_MIN = -2;  // 0.01
const DISTANCE_EXP_MAX = 4;   // 9,999

/**
 * Distance scoring rule from Greenberg (2018), Section 9.1.1.
 *
 * Uses linear distances: r, s, t are simple differences divided by c=100.
 * Interval expansion is additive: L - delta, U + delta.
 */
function scoreDistance(
    x: number,
    L: number,
    U: number,
    beta: number,
): number {
    // Step 1: Expand interval (additive for Distance rule)
    const Lexp = L - DELTA;
    const Uexp = U + DELTA;

    // Step 2: Compute s (interval width)
    const s = (Uexp - Lexp) / C_DISTANCE;

    // Step 3: Score based on where x falls
    let raw: number;

    if (x < Lexp) {
        const r = (Lexp - x) / C_DISTANCE;
        raw = (-2 / (1 - beta)) * r - (r / (1 + r)) * s;
    } else if (x > Uexp) {
        const t = (x - Uexp) / C_DISTANCE;
        raw = (-2 / (1 - beta)) * t - (t / (1 + t)) * s;
    } else {
        // x is inside the expanded interval
        const r = (x - Lexp) / C_DISTANCE;
        const t = (Uexp - x) / C_DISTANCE;
        raw = 4 * SMAX * (r * t) / (s * s) * (1 - s / (1 + s));
    }

    // Step 4: Clamp to floor
    return Math.max(raw, SMIN);
}

/**
 * Order of Magnitude scoring rule from Greenberg (2018), Section 9.1.2.
 *
 * Uses log-ratios: r, s, t are natural-log ratios divided by c=ln(100).
 * Interval expansion is multiplicative: L*(1-delta), U*(1+delta).
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
    const s = Math.log(Uexp / Lexp) / C_OOM;

    // Step 3: Score based on where x falls
    let raw: number;

    if (x < Lexp) {
        const r = Math.log(Lexp / x) / C_OOM;
        raw = (-2 / (1 - beta)) * r - (r / (1 + r)) * s;
    } else if (x > Uexp) {
        const t = Math.log(x / Uexp) / C_OOM;
        raw = (-2 / (1 - beta)) * t - (t / (1 + t)) * s;
    } else {
        // x is inside the expanded interval
        const r = Math.log(x / Lexp) / C_OOM;
        const t = Math.log(Uexp / x) / C_OOM;
        raw = 4 * SMAX * (r * t) / (s * s) * (1 - s / (1 + s));
    }

    // Step 4: Clamp to floor
    return Math.max(raw, SMIN);
}

/**
 * Calculate score for a single question.
 *
 * Automatically selects the scoring rule based on answer magnitude:
 *   - Distance rule for "normal" answers (exponent in [-2, 4], i.e. 0.01 to 9,999)
 *   - Order of Magnitude rule for very large or very small answers
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
    // Convert exponents to actual values
    const L = Math.pow(10, lowerExp);
    const U = Math.pow(10, upperExp);
    const x = Math.pow(10, trueExp);

    // Ensure L < U
    const actualL = Math.min(L, U);
    const actualU = Math.max(L, U);

    const beta = confidence / 100;

    // "Hit" = true answer inside user's original (non-expanded) interval
    const hit = trueExp >= Math.min(lowerExp, upperExp)
             && trueExp <= Math.max(lowerExp, upperExp);

    // Select scoring rule based on answer magnitude
    const useDistance = trueExp >= DISTANCE_EXP_MIN && trueExp <= DISTANCE_EXP_MAX;

    let points: number;
    if (actualL === actualU) {
        // Degenerate interval — use a tiny spread
        const tiny = actualL * 0.001;
        if (useDistance) {
            points = scoreDistance(x, actualL - tiny, actualU + tiny, beta);
        } else {
            points = scoreOrderOfMagnitude(x, actualL - tiny, actualU + tiny, beta);
        }
    } else {
        if (useDistance) {
            points = scoreDistance(x, actualL, actualU, beta);
        } else {
            points = scoreOrderOfMagnitude(x, actualL, actualU, beta);
        }
    }

    // Round to 2 decimal places for display
    points = Math.round(points * 100) / 100;

    return { points, hit, trueExponent: trueExp };
}
