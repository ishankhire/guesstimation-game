"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function UsernamePage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { update } = useSession();
  const autoSubmitted = useRef(false);

  const saveUsername = async (name: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      localStorage.removeItem("pendingUsername");
      await update();
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Auto-submit if a pending username was stored before OAuth
  useEffect(() => {
    if (autoSubmitted.current) return;
    const pending = localStorage.getItem("pendingUsername");
    if (pending) {
      autoSubmitted.current = true;
      setUsername(pending);
      saveUsername(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUsername(username);
  };

  const isValid =
    username.length >= 4 && username.length <= 17 && /^[a-zA-Z0-9_]+$/.test(username);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <h1 className="text-2xl font-bold">Choose a Username</h1>
        <p className="text-muted text-sm">
          4-17 characters: letters, numbers, and underscores
        </p>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            maxLength={17}
            className="w-full p-3 rounded-lg text-center text-lg"
            style={{
              border: "1.5px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          />
          <div className="text-xs text-muted">
            {username.length}/17 characters
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="play-btn w-full"
            disabled={!isValid || loading}
            style={{ opacity: !isValid || loading ? 0.4 : 1 }}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
