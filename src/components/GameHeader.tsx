"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { type ConfidenceLevel } from "@/lib/scoring";

const CONFIDENCE_LEVELS: ConfidenceLevel[] = [60, 75, 90];

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
    localStorage.setItem("pendingUsername", usernameInput);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Rating | Question | Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "var(--muted)" }}>
            Rating
          </span>
          <span className="text-2xl font-bold font-mono" style={{ color: "var(--accent)" }}>
            {Math.round(rating)}
          </span>
          {username && (
            <span className="text-sm text-muted">
              {username}
            </span>
          )}
        </div>

        <div className="text-sm font-semibold tracking-wide" style={{ color: "var(--muted)" }}>
          {questionIndex + 1} / {totalQuestions}
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold font-mono ${timeRemaining <= 15 ? "timer-critical" : ""}`}
          >
            {timeRemaining}
          </span>
          <span className="text-sm text-muted">sec</span>
        </div>
      </div>

      {/* Row 2: Confidence selector + user actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Confidence</span>
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            Score: {score.toFixed(2)}
          </span>
          {isAuthenticated ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          ) : !showUsernameForm ? (
            <button
              onClick={() => setShowUsernameForm(true)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={{ background: "var(--surface-light)", color: "var(--accent)" }}
            >
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Username"
                maxLength={17}
                className="px-2 py-1 rounded-lg text-xs w-32"
                style={{
                  border: "1.5px solid var(--border)",
                  background: "var(--surface-light)",
                  color: "var(--foreground)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSignIn();
                }}
              />
              {usernameInput.length > 0 && !isValidUsername && (
                <span className="text-xs" style={{ color: "var(--danger)" }}>
                  4–17 chars
                </span>
              )}
              <button
                onClick={handleSignIn}
                disabled={!isValidUsername}
                className="px-2 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: isValidUsername ? "var(--accent)" : "var(--surface-light)",
                  color: isValidUsername ? "var(--background)" : "var(--muted)",
                  cursor: isValidUsername ? "pointer" : "not-allowed",
                }}
              >
                Google
              </button>
              <button
                onClick={() => setShowUsernameForm(false)}
                className="text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
