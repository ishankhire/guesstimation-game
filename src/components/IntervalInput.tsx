"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { formatWithCommas, parseInputValue } from "@/lib/parseAnswer";

interface IntervalInputProps {
  unit: string;
  onSubmit: (lower: number, upper: number) => void;
}

export default function IntervalInput({ unit, onSubmit }: IntervalInputProps) {
  const [lowerStr, setLowerStr] = useState("");
  const [upperStr, setUpperStr] = useState("");
  const [error, setError] = useState("");
  const upperRef = useRef<HTMLInputElement>(null);

  function handleBlur(
    value: string,
    setter: (v: string) => void
  ) {
    if (value.trim() === "") return;
    setter(formatWithCommas(value));
  }

  function handleFocus(value: string, setter: (v: string) => void) {
    // Remove commas for easier editing
    setter(value.replace(/,/g, ""));
  }

  function handleSubmit() {
    const lower = parseInputValue(lowerStr);
    const upper = parseInputValue(upperStr);

    if (isNaN(lower) || isNaN(upper)) {
      setError("Please enter valid numbers for both bounds.");
      return;
    }
    if (lower <= 0 || upper <= 0) {
      setError("Both bounds must be positive numbers.");
      return;
    }
    if (lower >= upper) {
      setError("Lower bound must be less than upper bound.");
      return;
    }

    setError("");
    onSubmit(lower, upper);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, isLower: boolean) {
    if (e.key === "Enter") {
      if (isLower && upperRef.current) {
        upperRef.current.focus();
      } else {
        handleSubmit();
      }
    }
  }

  const displayUnit = unit === "$" ? "" : unit;

  return (
    <div className="w-full px-6 py-4">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">
        80% Confidence Interval
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Lower Bound
          </label>
          <div className="flex items-center gap-2">
            {unit === "$" && (
              <span className="text-zinc-500 dark:text-zinc-400 text-lg">$</span>
            )}
            <input
              type="text"
              inputMode="decimal"
              value={lowerStr}
              onChange={(e) => setLowerStr(e.target.value)}
              onBlur={() => handleBlur(lowerStr, setLowerStr)}
              onFocus={() => handleFocus(lowerStr, setLowerStr)}
              onKeyDown={(e) => handleKeyDown(e, true)}
              placeholder="e.g. 1,000"
              className="w-full px-4 py-3 text-lg border-2 border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
            />
            {displayUnit && (
              <span className="text-zinc-500 dark:text-zinc-400 text-sm whitespace-nowrap">
                {displayUnit}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Upper Bound
          </label>
          <div className="flex items-center gap-2">
            {unit === "$" && (
              <span className="text-zinc-500 dark:text-zinc-400 text-lg">$</span>
            )}
            <input
              ref={upperRef}
              type="text"
              inputMode="decimal"
              value={upperStr}
              onChange={(e) => setUpperStr(e.target.value)}
              onBlur={() => handleBlur(upperStr, setUpperStr)}
              onFocus={() => handleFocus(upperStr, setUpperStr)}
              onKeyDown={(e) => handleKeyDown(e, false)}
              placeholder="e.g. 100,000"
              className="w-full px-4 py-3 text-lg border-2 border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
            />
            {displayUnit && (
              <span className="text-zinc-500 dark:text-zinc-400 text-sm whitespace-nowrap">
                {displayUnit}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
