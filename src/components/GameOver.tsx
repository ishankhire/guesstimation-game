interface GameOverProps {
  score: number;
  totalQuestions: number;
  onPlayAgain: () => void;
}

export default function GameOver({ score, totalQuestions, onPlayAgain }: GameOverProps) {
  const maxPossible = totalQuestions * 10; // smax = 10 per question (Greenberg 2018)
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
        <button className="play-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
