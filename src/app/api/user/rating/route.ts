import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, questionsPlayed } = await req.json();

  if (typeof rating !== "number" || rating < 0 || rating > 10000) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  if (typeof questionsPlayed !== "number" || questionsPlayed < 0) {
    return NextResponse.json({ error: "Invalid questionsPlayed" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { rating, questionsPlayed },
  });

  return NextResponse.json({ success: true });
}
