import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: any
) {
  const userId = parseInt(context.params.id) ;
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newFrozenStatus = user.isFrozen ? 0 : 1;

  await db
    .update(users)
    .set({ isFrozen: newFrozenStatus })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, isFrozen: newFrozenStatus });
}