"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { answerToExponent } from "@/lib/parseAnswer";
import { calculateScore, type ConfidenceLevel } from "@/lib/scoring";
import { updateRating, INITIAL_RATING } from "@/lib/rating";
import { type FermiQuestion, type GamePhase, type FeedbackData } from "@/lib/types";
import { shuffleArray } from "@/lib/utils";
import GameHeader from "@/components/GameHeader";
import QuestionCard from "@/components/QuestionCard";
import FeedbackCard from "@/components/FeedbackCard";
import GameOver from "@/components/GameOver";

const TIME_PER_QUESTION = 175;
const DISTANCE_EXP_MIN = -2;
const DISTANCE_EXP_MAX = 4;

function isScientificMode(answer: number): boolean {
  const exp = Math.log10(Math.abs(answer));
  return exp < DISTANCE_EXP_MIN || exp > DISTANCE_EXP_MAX;
}

/** Parse integer string, returns NaN if it contains a decimal point. */
function parseIntStrict(s: string): number {
  if (s.includes(".")) return NaN;
  const n = Number(s);
  return Number.isInteger(n) ? n : NaN;
}

export default function Home() {
  const [allQuestions, setAllQuestions] = useState<FermiQuestion[]>([]);
  const [gameQuestions, setGameQuestions] = useState<FermiQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [rating, setRating] = useState(INITIAL_RATING);
  const [confidence, setConfidence] = useState<ConfidenceLevel>(80);

  // Plain mode bounds
  const [lowerPlain, setLowerPlain] = useState("");
  const [upperPlain, setUpperPlain] = useState("");

  // Scientific mode bounds
  const [lowerCoeff, setLowerCoeff] = useState("");
  const [lowerExp, setLowerExp] = useState("");
  const [lowerExpError, setLowerExpError] = useState("");
  const [upperCoeff, setUpperCoeff] = useState("");
  const [upperExp, setUpperExp] = useState("");
  const [upperExpError, setUpperExpError] = useState("");

  // Submitted bound values (for FeedbackCard display)
  const [submittedLower, setSubmittedLower] = useState<number | null>(null);
  const [submittedUpper, setSubmittedUpper] = useState<number | null>(null);
  const [submittedScientific, setSubmittedScientific] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = gameQuestions[questionIndex] ?? null;
  const useScientific = currentQuestion ? isScientificMode(currentQuestion.answer) : false;

  const handleLowerExpChange = (v: string) => {
    setLowerExp(v);
    if (v.includes(".")) {
      setLowerExpError("Exponent must be an integer");
    } else {
      setLowerExpError("");
    }
  };

  const handleUpperExpChange = (v: string) => {
    setUpperExp(v);
    if (v.includes(".")) {
      setUpperExpError("Exponent must be an integer");
    } else {
      setUpperExpError("");
    }
  };

  const resetBounds = () => {
    setLowerPlain("");
    setUpperPlain("");
    setLowerCoeff("");
    setLowerExp("");
    setLowerExpError("");
    setUpperCoeff("");
    setUpperExp("");
    setUpperExpError("");
    setSubmittedLower(null);
    setSubmittedUpper(null);
  };

  const startGame = useCallback(
    (questions: FermiQuestion[]) => {
      const shuffled = shuffleArray(questions);
      setGameQuestions(shuffled);
      setQuestionIndex(0);
      setScore(0);
      setRating(INITIAL_RATING);
      setConfidence(80);
      resetBounds();
      setTimeRemaining(TIME_PER_QUESTION);
      setPhase("playing");
      setFeedbackData(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Load questions and start game immediately
  useEffect(() => {
    fetch("/questions.json")
      .then((res) => res.json())
      .then((data: FermiQuestion[]) => {
        const valid = data.filter((q) => !isNaN(q.answer) && q.answer > 0);
        setAllQuestions(valid);
        startGame(valid);
      })
      .catch(() => setPhase("loading"));
  }, [startGame]);

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

  const canSubmit = (() => {
    if (phase !== "playing") return false;
    if (useScientific) {
      return (
        lowerCoeff !== "" &&
        lowerExp !== "" &&
        !lowerExpError &&
        upperCoeff !== "" &&
        upperExp !== "" &&
        !upperExpError
      );
    } else {
      return lowerPlain !== "" && upperPlain !== "";
    }
  })();

  const handleSubmit = useCallback(() => {
    if (phase !== "playing") return;

    const currentQ = gameQuestions[questionIndex];
    if (!currentQ) return;

    const sci = isScientificMode(currentQ.answer);
    let lowerVal: number;
    let upperVal: number;

    if (sci) {
      const lCoeff = lowerCoeff === "" ? NaN : parseFloat(lowerCoeff);
      const uCoeff = upperCoeff === "" ? NaN : parseFloat(upperCoeff);
      const lExpVal = lowerExp === "" ? NaN : parseIntStrict(lowerExp);
      const uExpVal = upperExp === "" ? NaN : parseIntStrict(upperExp);
      lowerVal = isNaN(lCoeff) || isNaN(lExpVal) ? -Infinity : lCoeff * Math.pow(10, lExpVal);
      upperVal = isNaN(uCoeff) || isNaN(uExpVal) ? -Infinity : uCoeff * Math.pow(10, uExpVal);
    } else {
      lowerVal = lowerPlain === "" ? -Infinity : parseFloat(lowerPlain);
      upperVal = upperPlain === "" ? -Infinity : parseFloat(upperPlain);
    }

    // Convert actual values to exponents for scoring
    const lowerExpForScore = lowerVal > 0 ? Math.log10(lowerVal) : -Infinity;
    const upperExpForScore = upperVal > 0 ? Math.log10(upperVal) : -Infinity;
    const trueExp = answerToExponent(currentQ.answer);

    const result = calculateScore(confidence, lowerExpForScore, upperExpForScore, trueExp);

    setSubmittedLower(lowerVal);
    setSubmittedUpper(upperVal);
    setSubmittedScientific(sci);
    setScore((prev) => prev + result.points);

    const newRating = updateRating(rating, result.points);
    const ratingDelta = Math.round((newRating - rating) * 100) / 100;
    setRating(newRating);

    setFeedbackData({
      points: result.points,
      hit: result.hit,
      trueExponent: result.trueExponent,
      rawAnswer: currentQ.answer,
      units: currentQ.units,
      source_text: currentQ.source_text,
      source_url: currentQ.source_url,
      ratingDelta,
    });
    setPhase("feedback");

    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase, gameQuestions, questionIndex, lowerCoeff, upperCoeff, lowerExp, upperExp, lowerPlain, upperPlain, confidence, rating]);

  const nextQuestion = useCallback(() => {
    if (questionIndex + 1 >= gameQuestions.length) {
      setPhase("end");
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    setConfidence(80);
    resetBounds();
    setTimeRemaining(TIME_PER_QUESTION);
    setFeedbackData(null);
    setPhase("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, gameQuestions.length]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-muted text-lg">Loading questions…</div>
      </div>
    );
  }

  if (phase === "end") {
    return (
      <GameOver
        score={score}
        rating={rating}
        totalQuestions={gameQuestions.length}
        onPlayAgain={() => startGame(allQuestions)}
      />
    );
  }

  const unit = currentQuestion ? currentQuestion.units : "";

  return (
    <div className="min-h-screen px-6 py-6 sm:px-10 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <GameHeader
          score={score}
          rating={rating}
          questionIndex={questionIndex}
          totalQuestions={gameQuestions.length}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          timeRemaining={timeRemaining}
        />

        {phase === "playing" && currentQuestion && (
          <QuestionCard
            question={currentQuestion.question}
            unit={unit}
            confidence={confidence}
            useScientific={useScientific}
            lowerPlain={lowerPlain}
            upperPlain={upperPlain}
            onLowerPlainChange={setLowerPlain}
            onUpperPlainChange={setUpperPlain}
            lowerCoeff={lowerCoeff}
            lowerExp={lowerExp}
            lowerExpError={lowerExpError}
            upperCoeff={upperCoeff}
            upperExp={upperExp}
            upperExpError={upperExpError}
            onLowerCoeffChange={setLowerCoeff}
            onLowerExpChange={handleLowerExpChange}
            onUpperCoeffChange={setUpperCoeff}
            onUpperExpChange={handleUpperExpChange}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
          />
        )}

        {phase === "feedback" && feedbackData && (
          <FeedbackCard
            feedbackData={feedbackData}
            lowerValue={submittedLower}
            upperValue={submittedUpper}
            useScientific={submittedScientific}
            confidence={confidence}
            isLastQuestion={questionIndex + 1 >= gameQuestions.length}
            onNext={nextQuestion}
          />
        )}
      </div>
    </div>
  );
}
