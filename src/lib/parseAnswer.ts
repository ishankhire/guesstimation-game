/**
 * Convert a numeric answer to its log10 exponent.
 * For example: 3.2e13 → ~13.5, 500 → ~2.7
 */
export function answerToExponent(answer: number): number {
  if (isNaN(answer) || answer === 0) return 0;
  return Math.log10(Math.abs(answer));
}
