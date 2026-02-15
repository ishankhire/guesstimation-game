import { type ConfidenceLevel } from "@/lib/scoring";

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [50, 60, 70, 80, 90];

interface GameHeaderProps {
  score: number;
  rating: number;
  questionIndex: number;
  totalQuestions: number;
  confidence: ConfidenceLevel;
  onConfidenceChange: (level: ConfidenceLevel) => void;
  timeRemaining: number;
}

export default function GameHeader({
  score,
  rating,
  questionIndex,
  totalQuestions,
  confidence,
  onConfidenceChange,
  timeRemaining,
}: GameHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* Score + Rating */}
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          Rating:
        </div>
        <div className="text-2xl font-bold">
          {Math.round(rating)}
        </div>
        <div className="text-xs text-muted mt-1">
          Score: {score.toFixed(2)}
        </div>
      </div>

      {/* Progress + Confidence */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          Question {questionIndex + 1} / {totalQuestions}
        </div>
        <div className="text-sm font-medium text-foreground">
          Confidence interval{" "}
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full border text-xs"
            style={{ borderColor: "var(--border)", fontSize: "0.65rem" }}
            title="Choose how confident you are that the true answer falls within your interval"
          >
            i
          </span>
        </div>
        <div className="confidence-bar">
          {CONFIDENCE_LEVELS.map((level) => (
            <button
              key={level}
              className={confidence === level ? "active" : ""}
              onClick={() => onConfidenceChange(level)}
            >
              {level}%
            </button>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="text-right">
        <div className="text-sm font-medium text-foreground">Time remaining:</div>
        <div
          className={`text-2xl font-bold ${timeRemaining <= 15 ? "timer-critical" : ""}`}
        >
          {timeRemaining} <span className="text-base font-normal text-muted">seconds</span>
        </div>
      </div>
    </div>
  );
}
