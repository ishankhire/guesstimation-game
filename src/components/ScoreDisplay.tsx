"use client";

interface ScoreDisplayProps {
  cumulativeScore: number;
  questionNumber: number;
  totalQuestions: number;
}

export default function ScoreDisplay({
  cumulativeScore,
  questionNumber,
  totalQuestions,
}: ScoreDisplayProps) {
  return (
    <div className="flex items-center justify-between w-full px-6 py-4">
      <div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Score:</span>
        <p
          className={`text-2xl font-bold ${
            cumulativeScore >= 0
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {cumulativeScore.toFixed(2)}{" "}
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
            points
          </span>
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          80% Confidence Interval
        </p>
      </div>

      <div className="text-right">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>
    </div>
  );
}
