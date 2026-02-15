"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
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
  username?: string;
  isAuthenticated?: boolean;
}

export default function GameHeader({
  score,
  rating,
  questionIndex,
  totalQuestions,
  confidence,
  onConfidenceChange,
  timeRemaining,
  username,
  isAuthenticated,
}: GameHeaderProps) {
  const [usernameInput, setUsernameInput] = useState("");
  const [showUsernameForm, setShowUsernameForm] = useState(false);

  const isValidUsername =
    usernameInput.length >= 4 &&
    usernameInput.length <= 17 &&
    /^[a-zA-Z0-9_]+$/.test(usernameInput);

  const handleSignIn = () => {
    if (!isValidUsername) return;
    // Store username in localStorage so /username page can auto-apply it
    localStorage.setItem("pendingUsername", usernameInput);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* Rating + User */}
      <div>
        <div className="flex items-baseline gap-2">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Rating:
            </div>
            <div className="text-2xl font-bold">
              {Math.round(rating)}
            </div>
          </div>
          {username && (
            <div className="text-sm font-medium text-muted ml-1">
              {username}
            </div>
          )}
        </div>
        <div className="text-xs text-muted mt-1">
          Score: {score.toFixed(2)}
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-muted hover:underline mt-1"
          >
            Sign out
          </button>
        ) : !showUsernameForm ? (
          <button
            onClick={() => setShowUsernameForm(true)}
            className="mt-2 px-3 py-1.5 rounded text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Sign in
          </button>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Choose a username"
              maxLength={17}
              className="px-2 py-1.5 rounded text-sm w-44"
              style={{
                border: "1.5px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignIn();
              }}
            />
            {usernameInput.length > 0 && !isValidUsername && (
              <div className="text-xs" style={{ color: "var(--danger)" }}>
                4–17 chars, letters/numbers/_
              </div>
            )}
            <button
              onClick={handleSignIn}
              disabled={!isValidUsername}
              className="px-3 py-1.5 rounded text-sm font-semibold"
              style={{
                background: isValidUsername ? "var(--accent)" : "var(--surface)",
                color: isValidUsername ? "#fff" : "var(--muted)",
                cursor: isValidUsername ? "pointer" : "not-allowed",
              }}
            >
              Sign in with Google
            </button>
            <button
              onClick={() => setShowUsernameForm(false)}
              className="text-xs text-muted hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
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
