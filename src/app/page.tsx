"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { parseAnswerRaw, answerToExponent, extractUnit } from "@/lib/parseAnswer";
import { calculateScore, type ConfidenceLevel } from "@/lib/scoring";
import { type FermiQuestion, type GamePhase, type FeedbackData } from "@/lib/types";
import { shuffleArray } from "@/lib/utils";
import GameHeader from "@/components/GameHeader";
import QuestionCard from "@/components/QuestionCard";
import FeedbackCard from "@/components/FeedbackCard";
import GameOver from "@/components/GameOver";

const TIME_PER_QUESTION = 175;

export default function Home() {
  const [allQuestions, setAllQuestions] = useState<FermiQuestion[]>([]);
  const [gameQuestions, setGameQuestions] = useState<FermiQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceLevel>(80);
  const [lowerBound, setLowerBound] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(
    (questions: FermiQuestion[]) => {
      const shuffled = shuffleArray(questions);
      setGameQuestions(shuffled);
      setQuestionIndex(0);
      setScore(0);
      setConfidence(80);
      setLowerBound("");
      setUpperBound("");
      setTimeRemaining(TIME_PER_QUESTION);
      setPhase("playing");
      setFeedbackData(null);
    },
    []
  );

  // Load questions and start game immediately
  useEffect(() => {
    fetch("/fermidata.json")
      .then((res) => res.json())
      .then((data: FermiQuestion[]) => {
        const valid = data.filter((q) => {
          const val = parseAnswerRaw(q.answer);
          return !isNaN(val) && val > 0;
        });
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
    if (questionIndex + 1 >= gameQuestions.length) {
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
        totalQuestions={gameQuestions.length}
        onPlayAgain={() => startGame(allQuestions)}
      />
    );
  }

  const currentQuestion = gameQuestions[questionIndex];
  const unit = currentQuestion ? extractUnit(currentQuestion.answer) : "";
  const canSubmit = phase === "playing" && lowerBound !== "" && upperBound !== "";

  return (
    <div className="min-h-screen px-6 py-6 sm:px-10 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <GameHeader
          score={score}
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
            lowerBound={lowerBound}
            upperBound={upperBound}
            onLowerBoundChange={setLowerBound}
            onUpperBoundChange={setUpperBound}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
          />
        )}

        {phase === "feedback" && feedbackData && (
          <FeedbackCard
            feedbackData={feedbackData}
            lowerBound={lowerBound}
            upperBound={upperBound}
            confidence={confidence}
            isLastQuestion={questionIndex + 1 >= gameQuestions.length}
            onNext={nextQuestion}
          />
        )}
      </div>
    </div>
  );
}
