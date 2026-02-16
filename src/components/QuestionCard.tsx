import { type ConfidenceLevel } from "@/lib/scoring";

interface BoundInputProps {
  label: string;
  unit: string;
  useScientific: boolean;
  // Plain mode
  plainValue: string;
  onPlainChange: (v: string) => void;
  // Scientific mode
  coeff: string;
  exp: string;
  expError: string;
  onCoeffChange: (v: string) => void;
  onExpChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function BoundInput({
  label,
  unit,
  useScientific,
  plainValue,
  onPlainChange,
  coeff,
  exp,
  expError,
  onCoeffChange,
  onExpChange,
  onKeyDown,
}: BoundInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>
      {useScientific ? (
        <div className="space-y-1">
          <div className="bound-group">
            <input
              type="number"
              placeholder=""
              value={coeff}
              onChange={(e) => onCoeffChange(e.target.value)}
              onKeyDown={onKeyDown}
              style={{ minWidth: 0, width: "3rem", flex: "0 1 3rem" }}
            />
            <span className="prefix">× 10^</span>
            <input
              type="number"
              placeholder=""
              value={exp}
              onChange={(e) => onExpChange(e.target.value)}
              onKeyDown={onKeyDown}
              style={{ minWidth: 0, flex: 1 }}
            />
            {unit && <span className="suffix">{unit}</span>}
          </div>
          {expError && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {expError}
            </p>
          )}
        </div>
      ) : (
        <div className="bound-group">
          <input
            type="number"
            placeholder=""
            value={plainValue}
            onChange={(e) => onPlainChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {unit && <span className="suffix">{unit}</span>}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: string;
  unit: string;
  confidence: ConfidenceLevel;
  useScientific: boolean;
  // Plain mode values
  lowerPlain: string;
  upperPlain: string;
  onLowerPlainChange: (v: string) => void;
  onUpperPlainChange: (v: string) => void;
  // Scientific mode values
  lowerCoeff: string;
  lowerExp: string;
  lowerExpError: string;
  upperCoeff: string;
  upperExp: string;
  upperExpError: string;
  onLowerCoeffChange: (v: string) => void;
  onLowerExpChange: (v: string) => void;
  onUpperCoeffChange: (v: string) => void;
  onUpperExpChange: (v: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export default function QuestionCard({
  question,
  unit,
  confidence,
  useScientific,
  lowerPlain,
  upperPlain,
  onLowerPlainChange,
  onUpperPlainChange,
  lowerCoeff,
  lowerExp,
  lowerExpError,
  upperCoeff,
  upperExp,
  upperExpError,
  onLowerCoeffChange,
  onLowerExpChange,
  onUpperCoeffChange,
  onUpperExpChange,
  onSubmit,
  canSubmit,
}: QuestionCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) onSubmit();
  };

  return (
    <>
      {/* Question */}
      <div>
        <p className="text-3xl sm:text-4xl font-medium leading-snug tracking-tight">{question}</p>
      </div>

      {/* Game Controls */}
      <div className="space-y-6">
        <h2 className="text-base font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          {confidence}% Confidence Interval
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <BoundInput
            label="Lower Bound"
            unit={unit}
            useScientific={useScientific}
            plainValue={lowerPlain}
            onPlainChange={onLowerPlainChange}
            coeff={lowerCoeff}
            exp={lowerExp}
            expError={lowerExpError}
            onCoeffChange={onLowerCoeffChange}
            onExpChange={onLowerExpChange}
            onKeyDown={handleKeyDown}
          />
          <BoundInput
            label="Upper Bound"
            unit={unit}
            useScientific={useScientific}
            plainValue={upperPlain}
            onPlainChange={onUpperPlainChange}
            coeff={upperCoeff}
            exp={upperExp}
            expError={upperExpError}
            onCoeffChange={onUpperCoeffChange}
            onExpChange={onUpperExpChange}
            onKeyDown={handleKeyDown}
          />
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
