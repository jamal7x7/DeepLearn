export const runtime = 'nodejs';
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { activityLogs, teams, users } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';

export async function GET(request: Request) {
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

    // Get teamId from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate date ranges
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Convert date objects to ISO strings for SQL queries
    const oneWeekAgoStr = oneWeekAgo.toISOString();
    const oneMonthAgoStr = oneMonthAgo.toISOString();
    
    // Daily activity (last 7 days)
    const dailyActivity = await db
      .select({
        day: sql<string>`to_char(${activityLogs.timestamp}, 'Dy')`,
        visits: sql<number>`count(*)`
      })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.teamId, parseInt(teamId)),
        sql`${activityLogs.timestamp} >= ${oneWeekAgoStr}`
      ))
      .groupBy(sql`to_char(${activityLogs.timestamp}, 'Dy')`)
      .orderBy(sql`min(${activityLogs.timestamp})`);

    // Weekly activity (last 4 weeks)
    const weeklyActivity = await db
      .select({
        day: sql<string>`to_char(${activityLogs.timestamp}, 'WW')`,
        visits: sql<number>`count(*)`
      })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.teamId, parseInt(teamId)),
        sql`${activityLogs.timestamp} >= ${oneMonthAgoStr}`
      ))
      .groupBy(sql`to_char(${activityLogs.timestamp}, 'WW')`)
      .orderBy(sql`min(${activityLogs.timestamp})`);

    // Monthly activity (last 6 months)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString();

    const monthlyActivity = await db
      .select({
        day: sql<string>`to_char(${activityLogs.timestamp}, 'Mon')`,
        visits: sql<number>`count(*)`
      })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.teamId, parseInt(teamId)),
        sql`${activityLogs.timestamp} >= ${sixMonthsAgoStr}`
      ))
      .groupBy(sql`to_char(${activityLogs.timestamp}, 'Mon')`)
      .orderBy(sql`min(${activityLogs.timestamp})`);

    return NextResponse.json({
      dailyActivity: dailyActivity.map(item => ({
        day: item.day,
        visits: Number(item.visits)
      })),
      weeklyActivity: weeklyActivity.map(item => ({
        day: `W${item.day}`,
        visits: Number(item.visits)
      })),
      monthlyActivity: monthlyActivity.map(item => ({
        day: item.day,
        visits: Number(item.visits)
      }))
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
