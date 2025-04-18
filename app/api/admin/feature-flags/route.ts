export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { featureFlags } from '@/db/schema/featureFlags';
import { getSession } from '@/lib/auth/session';

// GET: Return all feature flags
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const flags = await db.select().from(featureFlags);
  return NextResponse.json({ flags });
}

// POST: Update a feature flag (expects { key, enabled })
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { key, enabled } = await req.json();
  if (typeof key !== 'string' || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  await db
    .insert(featureFlags)
    .values({ key, enabled })
    .onConflictDoUpdate({ target: featureFlags.key, set: { enabled } });
  return NextResponse.json({ success: true });
}
