"use client";

import { useState, useEffect } from "react";
import { type LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
  currentUsername?: string;
}

export default function Leaderboard({ currentUsername }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: LeaderboardEntry[]) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <div className="text-muted text-lg">Loading leaderboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <div className="text-danger text-lg">Failed to load leaderboard.</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "40vh" }}>
        <div className="text-muted text-lg">No players on the leaderboard yet.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Top Players</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            <th className="pb-2 pr-4 w-12">#</th>
            <th className="pb-2 pr-4">Username</th>
            <th className="pb-2 pr-4 text-right">Rating</th>
            <th className="pb-2 text-right">Games</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const isCurrentUser = currentUsername && entry.username === currentUsername;
            return (
              <tr
                key={entry.username}
                className="border-t"
                style={{
                  borderColor: "var(--border)",
                  background: isCurrentUser ? "rgba(91, 95, 239, 0.08)" : undefined,
                }}
              >
                <td className="py-2 pr-4 font-mono text-sm" style={{ color: "var(--muted)" }}>
                  {i + 1}
                </td>
                <td className="py-2 pr-4 font-semibold">
                  {entry.username}
                  {isCurrentUser && (
                    <span className="text-xs ml-2" style={{ color: "var(--accent)" }}>
                      (you)
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right font-mono font-bold">
                  {Math.round(entry.rating)}
                </td>
                <td className="py-2 text-right text-sm" style={{ color: "var(--muted)" }}>
                  {entry.questionsPlayed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
