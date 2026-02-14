import { type FeedbackData } from "@/lib/types";
import { formatExponent, formatAnswer } from "@/lib/utils";

interface FeedbackCardProps {
  feedbackData: FeedbackData;
  lowerBound: string;
  upperBound: string;
  confidence: number;
  isLastQuestion: boolean;
  onNext: () => void;
}

export default function FeedbackCard({
  feedbackData,
  lowerBound,
  upperBound,
  confidence,
  isLastQuestion,
  onNext,
}: FeedbackCardProps) {
  return (
    <div className="feedback-card card space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{
            background: feedbackData.hit ? "var(--success)" : "var(--danger)",
          }}
        >
          {feedbackData.hit ? "✓" : "✗"}
        </div>
        <div>
          <h3 className="font-bold text-lg">
            {feedbackData.hit ? "Hit!" : "Miss!"}
          </h3>
          <p className="text-sm text-muted">
            {feedbackData.hit
              ? "The true answer falls within your interval"
              : "The true answer is outside your interval"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ background: "var(--surface)" }}>
          <p className="text-xs text-muted mb-1">True Answer</p>
          <p className="font-mono text-lg font-bold">
            {formatAnswer(feedbackData.rawAnswer)}
          </p>
          <p className="text-xs text-muted mt-1 font-mono">
            ≈ {formatExponent(feedbackData.trueExponent)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "var(--surface)" }}>
          <p className="text-xs text-muted mb-1">Points</p>
          <p
            className="font-mono text-lg font-bold"
            style={{ color: feedbackData.points >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {feedbackData.points > 0 ? "+" : ""}
            {feedbackData.points}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: "var(--surface)" }}>
        <p className="text-xs text-muted mb-1">Your Interval</p>
        <p className="font-mono text-sm">
          10^{lowerBound || "?"} → 10^{upperBound || "?"}{" "}
          <span className="text-muted">at {confidence}% confidence</span>
        </p>
      </div>

      <div>
        <button className="submit-btn" onClick={onNext}>
          {isLastQuestion ? "See Results →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}
