import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await req.json();

  if (typeof username !== "string" || username.length < 4 || username.length > 17) {
    return NextResponse.json({ error: "Username must be 4-17 characters" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, and underscores" },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username },
  });

  const response = NextResponse.json({ success: true });
  // Set cookie so middleware knows username exists (avoids DB lookup in Edge)
  response.cookies.set("has-username", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return response;
}
