"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Guesstimation</h1>
        <p className="text-muted text-sm">
          Test your calibration with Fermi estimation questions.
          Sign in to save your rating across sessions.
        </p>
        <button
          className="play-btn flex items-center gap-3"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign in with Google
        </button>
        <Link href="/" className="text-sm text-muted hover:underline">
          Play without signing in
        </Link>
      </div>
    </div>
  );
}
