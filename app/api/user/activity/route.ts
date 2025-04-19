export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { eq, and, sql, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { activityLogs, teamMembers } from '@/lib/db/schema';

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
    if (teamIds.length === 0) return NextResponse.json([]);

    // Aggregate activity logs per day for these teams
    const activity = await db
      .select({
        day: sql`DATE(${activityLogs.timestamp})`,
        visits: sql`COUNT(*)::int`
      })
      .from(activityLogs)
      .where(inArray(activityLogs.teamId, teamIds))
      .groupBy(sql`DATE(${activityLogs.timestamp})`)
      .orderBy(sql`DATE(${activityLogs.timestamp})`);
    console.log('DEBUG: Activity result', activity);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('DEBUG: Error in activity endpoint', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
