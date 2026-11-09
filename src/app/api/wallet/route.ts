export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coinTransactions, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const transactions = await db
    .select()
    .from(coinTransactions)
    .where(eq(coinTransactions.userId, session.id))
    .orderBy(desc(coinTransactions.createdAt))
    .limit(50);

  return NextResponse.json({
    balance: session.coinsBalance,
    stellarAddress: session.stellarAddress,
    transactions,
  });
}

const stellarAddressPattern = /^G[A-Z2-7]{55}$/;

/** Stores a public Testnet recipient only; Bountixx never receives a secret key. */
export async function PATCH(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json() as { stellarAddress?: unknown };
    const raw = body.stellarAddress;
    if (raw !== null && raw !== undefined && typeof raw !== "string") {
      return NextResponse.json({ error: "A Stellar address must be text." }, { status: 400 });
    }
    const stellarAddress = typeof raw === "string" ? raw.trim().toUpperCase() : null;
    if (stellarAddress && !stellarAddressPattern.test(stellarAddress)) {
      return NextResponse.json({ error: "Enter a valid Stellar public key beginning with G." }, { status: 400 });
    }
    await db.update(users).set({ stellarAddress }).where(eq(users.id, session.id));
    return NextResponse.json({ stellarAddress });
  } catch {
    return NextResponse.json({ error: "Could not update your Stellar recipient." }, { status: 400 });
  }
}
