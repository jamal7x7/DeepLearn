import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const students = await db.select().from(users).where(eq(users.role, 'student'));
  return NextResponse.json({ students });
}