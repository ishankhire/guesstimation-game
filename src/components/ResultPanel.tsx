"use client";

import { SubmissionResult } from "@/lib/types";
import { formatAnswerDisplay } from "@/lib/parseAnswer";

interface ResultPanelProps {
  result: SubmissionResult;
  onNext: () => void;
}

export default function ResultPanel({ result, onNext }: ResultPanelProps) {
  const { score, actualAnswer, lowerBound, upperBound, scoringRule } = result;
  const isPositive = score >= 0;

  function formatBound(value: number, unit: string): string {
    return formatAnswerDisplay(value, unit);
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="rounded-xl border-2 border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
        {/* Score */}
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            Score for this question
          </p>
          <p
            className={`text-4xl font-bold ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {score.toFixed(2)}
          </p>
        </div>

        {/* Actual answer */}
        <div className="text-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            Actual Answer
          </p>
          <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            {actualAnswer.display}
          </p>
        </div>

        {/* User's interval */}
        <div className="text-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            Your Interval
          </p>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            [{formatBound(lowerBound, actualAnswer.unit)} ,{" "}
            {formatBound(upperBound, actualAnswer.unit)}]
          </p>
        </div>

        {/* Scoring rule used */}
        <div className="text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Scored with{" "}
            {scoringRule === "distance"
              ? "Distance"
              : "Order of Magnitude"}{" "}
            rule
          </p>
        </div>

        {/* Next button */}
        <div className="pt-4 text-center">
          <button
            onClick={onNext}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
}
