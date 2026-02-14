/**
 * Parse a messy Fermi dataset answer string into a numeric value.
 * Handles formats like: "3.20E+13", "500", "2772 kg", "$7.2e+14", "0.23", "1.6e+20 N"
 */
export function parseAnswerRaw(raw: string): number {
  // Strip currency symbols, units, and whitespace — keep only numeric/scientific notation
  const cleaned = raw
    .replace(/[$€£¥]/g, "")
    .replace(/,/g, "")
    .trim();

  // Extract the first number (possibly in scientific notation) from the string
  const match = cleaned.match(/[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
  if (!match) return NaN;

  return parseFloat(match[0]);
}

/**
 * Convert a raw answer string to its log10 exponent.
 * For example: "3.20E+13" → ~13.5, "500" → ~2.7
 */
export function answerToExponent(raw: string): number {
  const value = parseAnswerRaw(raw);
  if (isNaN(value) || value === 0) return 0;
  return Math.log10(Math.abs(value));
}

/**
 * Extract the unit portion from an answer string.
 * E.g. "2772 kg" → "kg", "$7.2e+14" → "", "1.6e+20 N" → "N"
 */
export function extractUnit(raw: string): string {
  const cleaned = raw
    .replace(/[$€£¥]/g, "")
    .replace(/,/g, "")
    .trim();

  // Remove the numeric/scientific notation part
  const unit = cleaned
    .replace(/[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/, "")
    .replace(/\*\*/g, "^")
    .trim();

  return unit;
}
