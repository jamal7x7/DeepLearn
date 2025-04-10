import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, parseInt(params.id)));
  return NextResponse.json({ success: true });
}