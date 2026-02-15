interface GameOverProps {
  score: number;
  rating: number;
  totalQuestions: number;
  onPlayAgain: () => void;
}

export default function GameOver({ score, rating, totalQuestions, onPlayAgain }: GameOverProps) {
  const ratingPct = Math.min(100, Math.round((rating / 10000) * 100));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 text-center max-w-lg">
        <div className="text-5xl mb-2">{rating >= 2000 ? "🏆" : "📊"}</div>
        <h1 className="text-3xl font-bold tracking-tight">Game Over</h1>
        <div className="card w-full space-y-4 text-center">
          <div className="text-5xl font-bold font-mono" style={{ color: "var(--accent)" }}>
            {Math.round(rating)}
          </div>
          <p className="text-muted text-sm">rating</p>
          <div className="w-full bg-[var(--surface)] rounded-full h-2 mt-4">
            <div
              className="h-2 rounded-full transition-all"
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
      </div>
    </div>
  );
}
