import { parseAnswerRaw } from "./parseAnswer";

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function formatExponent(exp: number): string {
  return `10^${exp.toFixed(1)}`;
}

export function formatAnswer(raw: string): string {
  const val = parseAnswerRaw(raw);
  if (isNaN(val)) return raw;
  if (Math.abs(val) >= 1e6 || (Math.abs(val) < 0.01 && val !== 0)) {
    return val.toExponential(2);
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
