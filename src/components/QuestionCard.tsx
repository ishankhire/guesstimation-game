import { type ConfidenceLevel } from "@/lib/scoring";

interface QuestionCardProps {
  question: string;
  unit: string;
  confidence: ConfidenceLevel;
  lowerBound: string;
  upperBound: string;
  onLowerBoundChange: (value: string) => void;
  onUpperBoundChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export default function QuestionCard({
  question,
  unit,
  confidence,
  lowerBound,
  upperBound,
  onLowerBoundChange,
  onUpperBoundChange,
  onSubmit,
  canSubmit,
}: QuestionCardProps) {
  return (
    <>
      {/* Question */}
      <div>
        <p className="text-2xl sm:text-3xl font-normal leading-snug">{question}</p>
      </div>

      {/* Game Controls */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold">{confidence}% Confidence Interval</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Lower Bound */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Lower Bound</label>
            <div className="bound-group">
              <span className="prefix">10^</span>
              <input
                type="number"
                placeholder=""
                value={lowerBound}
                onChange={(e) => onLowerBoundChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
              {unit && <span className="suffix">{unit}</span>}
            </div>
          </div>

          {/* Upper Bound */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Upper Bound</label>
            <div className="bound-group">
              <span className="prefix">10^</span>
              <input
                type="number"
                placeholder=""
                value={upperBound}
                onChange={(e) => onUpperBoundChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
              {unit && <span className="suffix">{unit}</span>}
            </div>
          </div>
        </div>

        <div>
          <button className="submit-btn" disabled={!canSubmit} onClick={onSubmit}>
            Submit
          </button>
        </div>
      </div>
    </>
  );
}
