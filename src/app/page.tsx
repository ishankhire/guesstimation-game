"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parseAnswerRaw, answerToExponent, extractUnit } from "@/lib/parseAnswer";
import { calculateScore, type ConfidenceLevel } from "@/lib/scoring";

interface FermiQuestion {
  question: string;
  answer: string;
}

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [50, 60, 70, 80, 90];
const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 175;

type GamePhase = "start" | "playing" | "feedback" | "end";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatExponent(exp: number): string {
  return `10^${exp.toFixed(1)}`;
}

function formatAnswer(raw: string): string {
  const val = parseAnswerRaw(raw);
  if (isNaN(val)) return raw;
  if (Math.abs(val) >= 1e6 || (Math.abs(val) < 0.01 && val !== 0)) {
    return val.toExponential(2);
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function Home() {
  const [allQuestions, setAllQuestions] = useState<FermiQuestion[]>([]);
  const [gameQuestions, setGameQuestions] = useState<FermiQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel>(80);
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION);
  const [phase, setPhase] = useState<GamePhase>("start");
  const [feedbackData, setFeedbackData] = useState<{
    points: number;
    hit: boolean;
    trueExponent: number;
    rawAnswer: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions on mount
  useEffect(() => {
    fetch("/fermidata.json")
      .then((res) => res.json())
      .then((data: FermiQuestion[]) => {
        const valid = data.filter((q) => {
          const val = parseAnswerRaw(q.answer);
          return !isNaN(val) && val > 0;
        });
        setAllQuestions(valid);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Timer logic
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, questionIndex]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (timeRemaining === 0 && phase === "playing") {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, phase]);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_GAME);
    setGameQuestions(shuffled);
    setQuestionIndex(0);
    setScore(0);
    setConfidence(80);
    setLowerBound("");
    setUpperBound("");
    setTimeRemaining(TIME_PER_QUESTION);
    setPhase("playing");
    setFeedbackData(null);
  }, [allQuestions]);

  const handleSubmit = useCallback(() => {
    if (phase !== "playing") return;

    const currentQ = gameQuestions[questionIndex];
    if (!currentQ) return;

    const lower = lowerBound === "" ? -Infinity : parseFloat(lowerBound);
    const upper = upperBound === "" ? -Infinity : parseFloat(upperBound);
    const trueExp = answerToExponent(currentQ.answer);

    const result = calculateScore(confidence, lower, upper, trueExp);

    setScore((prev) => prev + result.points);
    setFeedbackData({
      points: result.points,
      hit: result.hit,
      trueExponent: result.trueExponent,
      rawAnswer: currentQ.answer,
    });
    setPhase("feedback");

    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase, gameQuestions, questionIndex, lowerBound, upperBound, confidence]);

  const nextQuestion = useCallback(() => {
    if (questionIndex + 1 >= QUESTIONS_PER_GAME) {
      setPhase("end");
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    setConfidence(80);
    setLowerBound("");
    setUpperBound("");
    setTimeRemaining(TIME_PER_QUESTION);
    setFeedbackData(null);
    setPhase("playing");
  }, [questionIndex]);

  const currentQuestion = gameQuestions[questionIndex];
  const unit = currentQuestion ? extractUnit(currentQuestion.answer) : "";

  // ─── START SCREEN ───
  if (phase === "start") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        {loading ? (
          <div className="text-muted text-lg">Loading questions…</div>
        ) : (
          <div className="flex flex-col items-center gap-8 text-center max-w-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl mb-2">🎯</div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>
                Guesstimation
              </h1>
              <p className="text-muted text-lg">Calibration Trainer</p>
            </div>
            <div className="card text-left space-y-3">
              <p className="text-sm text-muted leading-relaxed">
                You&apos;ll see <strong className="text-foreground">{QUESTIONS_PER_GAME} Fermi estimation questions</strong>.
                For each one, choose your confidence level and provide a range
                in orders of magnitude (<span className="font-mono" style={{ color: "var(--accent)" }}>10^X</span>).
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Tighter intervals at lower confidence = more points.
                But miss the target while overconfident and you&apos;ll lose points!
              </p>
            </div>
            <button className="play-btn" onClick={startGame}>
              Start Game
            </button>
            <p className="text-xs text-muted">
              {allQuestions.length} questions loaded
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── END SCREEN ───
  if (phase === "end") {
    const maxPossible = QUESTIONS_PER_GAME * 200;
    const percentage = Math.max(0, Math.round((score / maxPossible) * 100));
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-lg">
          <div className="text-5xl mb-2">{score > 0 ? "🏆" : "📊"}</div>
          <h1 className="text-3xl font-bold tracking-tight">Game Over</h1>
          <div className="card w-full space-y-4 text-center">
            <div className="text-5xl font-bold font-mono" style={{ color: "var(--accent)" }}>
              {score.toFixed(2)}
            </div>
            <p className="text-muted text-sm">points</p>
            <div className="w-full bg-[var(--surface)] rounded-full h-2 mt-4">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, percentage)}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
          <button className="play-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // ─── PLAYING / FEEDBACK SCREEN ───
  const canSubmit =
    phase === "playing" && lowerBound !== "" && upperBound !== "";

  return (
    <div className="min-h-screen px-6 py-6 sm:px-10 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ─── HEADER BAR ─── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Score */}
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Score:
            </div>
            <div className="text-2xl font-bold">
              {score.toFixed(2)} <span className="text-base font-normal text-muted">points</span>
            </div>
          </div>

          {/* Confidence selector — inline in header */}
          <div className="flex flex-col items-center gap-1">
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
                  onClick={() => setConfidence(level)}
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
              className={`text-2xl font-bold ${timeRemaining <= 15 ? "timer-critical" : ""
                }`}
            >
              {timeRemaining} <span className="text-base font-normal text-muted">seconds</span>
            </div>
          </div>
        </div>

        {/* ─── QUESTION ─── */}
        <div>
          <p className="text-2xl sm:text-3xl font-normal leading-snug">
            {currentQuestion?.question}
          </p>
        </div>

        {/* ─── GAME CONTROLS ─── */}
        {phase === "playing" && (
          <div className="space-y-6">
            {/* Interval heading */}
            <h2 className="text-lg font-bold">
              {confidence}% Confidence Interval
            </h2>

            {/* Lower + Upper bound inputs side by side */}
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
                    onChange={(e) => setLowerBound(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && canSubmit && handleSubmit()
                    }
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
                    onChange={(e) => setUpperBound(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && canSubmit && handleSubmit()
                    }
                  />
                  {unit && <span className="suffix">{unit}</span>}
                </div>
              </div>
            </div>

            {/* Submit — left aligned */}
            <div>
              <button
                className="submit-btn"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* ─── FEEDBACK ─── */}
        {phase === "feedback" && feedbackData && (
          <div className="feedback-card card space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold ${feedbackData.hit
                    ? "text-white"
                    : "text-white"
                  }`}
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
              <button className="submit-btn" onClick={nextQuestion}>
                {questionIndex + 1 < QUESTIONS_PER_GAME
                  ? "Next Question →"
                  : "See Results →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
