export type ConfidenceLevel = 50 | 60 | 70 | 80 | 90;

interface ScoreResult {
    points: number;
    hit: boolean;
    trueExponent: number;
}

const CONFIDENCE_MULTIPLIER: Record<ConfidenceLevel, number> = {
    50: 2.0,
    60: 1.7,
    70: 1.4,
    80: 1.2,
    90: 1.0,
};

const MISS_PENALTY: Record<ConfidenceLevel, number> = {
    50: 20,
    60: 40,
    70: 60,
    80: 80,
    90: 100,
};

const BASE_POINTS = 100;

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
    const hit = trueExp >= lowerExp && trueExp <= upperExp;
    const intervalWidth = Math.max(upperExp - lowerExp, 0.1);

    if (hit) {
        const tightnessBonus = Math.max(1, 10 / intervalWidth);
        const points = Math.round(
            BASE_POINTS * CONFIDENCE_MULTIPLIER[confidence] * tightnessBonus
        );
        return { points, hit, trueExponent: trueExp };
    } else {
        const points = -MISS_PENALTY[confidence];
        return { points, hit, trueExponent: trueExp };
    }
}
