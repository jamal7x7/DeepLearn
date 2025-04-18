export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { teamMembers } from '@/lib/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    console.log('DEBUG: Session', session);
    if (!session?.user?.id) {
      console.log('DEBUG: Unauthorized - no session user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all team IDs for the current user
    const userTeams = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id));
    const teamIds = userTeams.map(t => t.teamId);
    console.log('DEBUG: User team IDs', teamIds);
    if (teamIds.length === 0) return NextResponse.json({ totalStudents: 0 });

    // Count unique users (students) in those teams
    const students = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(inArray(teamMembers.teamId, teamIds))
      .groupBy(teamMembers.userId);
    const totalStudents = students.length;
    console.log('DEBUG: Total students', totalStudents);

    return NextResponse.json({ totalStudents });
  } catch (error) {
    console.error('DEBUG: Error in total-students endpoint', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
