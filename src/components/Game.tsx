"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionData, ParsedAnswer, SubmissionResult } from "@/lib/types";
import { parseAnswer } from "@/lib/parseAnswer";
import { computeScore } from "@/lib/scoring";
import ScoreDisplay from "./ScoreDisplay";
import QuestionCard from "./QuestionCard";
import IntervalInput from "./IntervalInput";
import ResultPanel from "./ResultPanel";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Game() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [parsedAnswers, setParsedAnswers] = useState<ParsedAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [phase, setPhase] = useState<"input" | "result">("input");
  const [lastResult, setLastResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/test_realfp.json")
      .then((res) => res.json())
      .then((data: QuestionData[]) => {
        const shuffled = shuffleArray(data);
        setQuestions(shuffled);
        setParsedAnswers(shuffled.map((q) => parseAnswer(q.answer)));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load questions.");
        setLoading(false);
      });
  }, []);

  const handleSubmit = useCallback(
    (lower: number, upper: number) => {
      const answer = parsedAnswers[currentIndex];
      const { score, rule } = computeScore(lower, upper, answer.value, answer.unit);

      const result: SubmissionResult = {
        score,
        actualAnswer: answer,
        lowerBound: lower,
        upperBound: upper,
        scoringRule: rule,
      };

      setCumulativeScore((prev) => prev + score);
      setLastResult(result);
      setPhase("result");
    },
    [currentIndex, parsedAnswers]
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setPhase("input");
    setLastResult(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Loading questions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">
            Game Over
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Final Score:{" "}
            <span
              className={`font-bold ${
                cumulativeScore >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {cumulativeScore.toFixed(2)}
            </span>
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            You answered {questions.length} questions
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            Average: {(cumulativeScore / questions.length).toFixed(2)} per
            question
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = parsedAnswers[currentIndex];

  return (
    <div className="min-h-screen max-w-3xl mx-auto">
      <ScoreDisplay
        cumulativeScore={cumulativeScore}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
      />

      <div className="border-b border-zinc-200 dark:border-zinc-700" />

      <QuestionCard question={currentQuestion.question} />

      {phase === "input" ? (
        <IntervalInput unit={currentAnswer.unit} onSubmit={handleSubmit} />
      ) : (
        lastResult && <ResultPanel result={lastResult} onNext={handleNext} />
      )}
    </div>
  );
}
