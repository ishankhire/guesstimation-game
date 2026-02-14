import { ParsedAnswer } from "./types";

export function parseAnswer(raw: string): ParsedAnswer {
  const trimmed = raw.trim();

  let isDollar = false;
  let working = trimmed;

  // Handle dollar prefix
  if (working.startsWith("$")) {
    isDollar = true;
    working = working.slice(1);
  }

  // Extract numeric portion and unit
  // Matches: optional negative, digits, optional decimal, optional scientific notation
  // Then optional space and remaining text as unit
  const match = working.match(/^([+-]?\d+\.?\d*(?:[eE][+-]?\d+)?)\s*(.*)?$/);

  let value: number;
  let unit: string;

  if (match) {
    value = parseFloat(match[1]);
    unit = match[2]?.trim() || "";
  } else {
    // Fallback: try parsing the whole thing as a number
    value = parseFloat(working);
    unit = "";
  }

  if (isDollar) {
    unit = unit ? `$ ${unit}` : "$";
  }

  const display = formatAnswerDisplay(value, unit);

  return { value, unit, display };
}

export function formatAnswerDisplay(value: number, unit: string): string {
  let formatted: string;

  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 0.01 && value !== 0)) {
    // Use scientific notation for very large or very small numbers
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    const mantissaStr =
      Math.abs(mantissa - Math.round(mantissa)) < 0.005
        ? Math.round(mantissa).toString()
        : mantissa.toFixed(2);
    formatted = `${mantissaStr} × 10^${exp}`;
  } else {
    formatted = value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  if (unit) {
    if (unit === "$") {
      return `$${formatted}`;
    }
    return `${formatted} ${unit}`;
  }
  return formatted;
}

export function formatWithCommas(value: string): string {
  const cleaned = value.replace(/,/g, "");

  // Don't format scientific notation
  if (/[eE]/.test(cleaned)) {
    return cleaned;
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return value;

  return num.toLocaleString("en-US", { maximumFractionDigits: 20 });
}

export function parseInputValue(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  return parseFloat(cleaned);
}
