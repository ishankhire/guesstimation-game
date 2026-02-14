const SMAX = 10;
const SMIN = -57.26893683880667;
const BETA = 0.8;
const DELTA = 0.4;
const C_DISTANCE = 100;
const C_OOM = Math.log(100); // ~4.605

export type ScoringRule = "distance" | "order_of_magnitude";

export function selectScoringRule(value: number, unit: string): ScoringRule {
  if (unit.includes("%")) {
    return "distance";
  }
  if (value >= 0.01 && value <= 10000) {
    return "distance";
  }
  return "order_of_magnitude";
}

export function computeScore(
  lower: number,
  upper: number,
  actual: number,
  unit: string
): { score: number; rule: ScoringRule } {
  const rule = selectScoringRule(actual, unit);

  if (lower <= 0 || upper <= 0 || actual <= 0) {
    // OoM requires positive values; Distance can handle but we keep consistent
    if (rule === "order_of_magnitude") {
      return { score: SMIN, rule };
    }
  }

  if (lower >= upper) {
    return { score: SMIN, rule };
  }

  const score =
    rule === "distance"
      ? scoreDistance(actual, lower, upper)
      : scoreOrderOfMagnitude(actual, lower, upper);

  return { score, rule };
}

function scoreDistance(x: number, L: number, U: number): number {
  const c = C_DISTANCE;

  // Step 1: Expand interval
  const Lexp = L - DELTA;
  const Uexp = U + DELTA;

  // Step 2: Compute s (interval width)
  const s = (Uexp - Lexp) / c;

  let raw: number;

  if (x < Lexp) {
    // Case 2: x below interval
    const r = (Lexp - x) / c;
    raw = (-2 / (1 - BETA)) * r - (r / (1 + r)) * s;
  } else if (x > Uexp) {
    // Case 3: x above interval
    const t = (x - Uexp) / c;
    raw = (-2 / (1 - BETA)) * t - (t / (1 + t)) * s;
  } else {
    // Case 1: x inside interval
    const r = (x - Lexp) / c;
    const t = (Uexp - x) / c;
    if (s === 0) return SMIN;
    raw = 4 * SMAX * ((r * t) / (s * s)) * (1 - s / (1 + s));
  }

  return Math.max(raw, SMIN);
}

function scoreOrderOfMagnitude(x: number, L: number, U: number): number {
  const c = C_OOM;

  // Step 1: Expand interval (multiplicative for OoM)
  const Lexp = L * (1 - DELTA);
  const Uexp = U * (1 + DELTA);

  if (Lexp <= 0 || Uexp <= 0 || x <= 0) {
    return SMIN;
  }

  // Step 2: Compute s
  const s = Math.log(Uexp / Lexp) / c;

  let raw: number;

  if (x < Lexp) {
    // Case 2: x below interval
    const r = Math.log(Lexp / x) / c;
    raw = (-2 / (1 - BETA)) * r - (r / (1 + r)) * s;
  } else if (x > Uexp) {
    // Case 3: x above interval
    const t = Math.log(x / Uexp) / c;
    raw = (-2 / (1 - BETA)) * t - (t / (1 + t)) * s;
  } else {
    // Case 1: x inside interval
    const r = Math.log(x / Lexp) / c;
    const t = Math.log(Uexp / x) / c;
    if (s === 0) return SMIN;
    raw = 4 * SMAX * ((r * t) / (s * s)) * (1 - s / (1 + s));
  }

  return Math.max(raw, SMIN);
}
