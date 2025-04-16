import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    console.log('DEBUG: Session', session);
    if (!session?.user?.id) {
      console.log('DEBUG: Unauthorized - no session user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all teams for the current user, with member count
    const result = await db
      .select({
        id: teams.id,
        name: teams.name,
        memberCount: sql`COUNT(tm.id)`
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, session.user.id))
      .groupBy(teams.id, teams.name);
    console.log('DEBUG: Teams result', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DEBUG: Error in teams endpoint', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
