export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

export async function DELETE(
  request: NextRequest,
  context: any
) {
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, parseInt(context.params.id)));
  return NextResponse.json({ success: true });
}
