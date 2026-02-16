import { signOut } from "next-auth/react";

interface GameOverProps {
  score: number;
  rating: number;
  totalQuestions: number;
  onPlayAgain: () => void;
  username?: string;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
}

export default function GameOver({
  score,
  rating,
  totalQuestions,
  onPlayAgain,
  username,
  isAuthenticated,
  onSignIn,
}: GameOverProps) {
  const ratingPct = Math.min(100, Math.round((rating / 10000) * 100));

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="flex flex-col items-center gap-8 text-center max-w-lg">
        <div className="text-5xl mb-2">{rating >= 2000 ? "🏆" : "📊"}</div>
        <h1 className="text-3xl font-bold tracking-tight">Game Over</h1>
        {username && (
          <p className="text-muted text-sm">{username}</p>
        )}
        <div className="card w-full space-y-4 text-center">
          <div className="text-6xl font-bold font-mono" style={{ color: "var(--accent)" }}>
            {Math.round(rating)}
          </div>
          <p className="text-muted text-sm uppercase tracking-wider">rating</p>
          <div className="w-full rounded-full h-3 mt-4" style={{ background: "var(--surface-light)" }}>
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${ratingPct}%`, background: "var(--accent)" }}
            />
          </div>
          <p className="text-muted text-xs">
            {score.toFixed(2)} points across {totalQuestions} questions
          </p>
        </div>
        <button className="play-btn" onClick={onPlayAgain}>
          Play Again
        </button>
        {!isAuthenticated && onSignIn && (
          <button
            onClick={onSignIn}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign in to save your progress
          </button>
        )}
        {isAuthenticated && (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
