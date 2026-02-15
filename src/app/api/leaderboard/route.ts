import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
      questionsPlayed: { gt: 0 },
    },
    select: {
      username: true,
      rating: true,
      questionsPlayed: true,
    },
    orderBy: { rating: "desc" },
    take: 100,
  });

  return NextResponse.json(users);
}
