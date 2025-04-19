export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    // Get the current user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is an admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user.length || user[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all teams
    const allTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt,
        memberCount: count(teamMembers.id).as('memberCount')
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .groupBy(teams.id)
      .orderBy(teams.name);

    return NextResponse.json({ teams: allTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}