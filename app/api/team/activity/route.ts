import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { activityLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ActivityLog } from '@/lib/db/schema';

/**
 * API Route: /api/team/activity
 * Query param: teamId (number)
 * Returns: { dailyActivity: [], weeklyActivity: [], monthlyActivity: [] }
 */
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
  }

  // Get current date/time
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start
  const startOfMonth = new Date(startOfToday);
  startOfMonth.setDate(1);

  // Fetch all logs for this team
  const logs: ActivityLog[] = await db.select().from(activityLogs).where(eq(activityLogs.teamId, Number(teamId)));

  // Helper to filter logs by date
  const filterLogs = (start: Date, end: Date, logs: ActivityLog[]) =>
    logs.filter((log) => {
      const ts = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      return ts >= start && ts < end;
    });

  // Group by day/week/month
  const groupBy = <T>(logs: T[], keyFn: (log: T) => string) => {
    const map = new Map<string, T[]>();
    for (const log of logs) {
      const key = keyFn(log);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, count: items.length, items }));
  };

  // Daily (today)
  const dailyActivity = groupBy(
    filterLogs(startOfToday, new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000), logs),
    (log) => (log.timestamp instanceof Date ? log.timestamp.toISOString().slice(0, 10) : new Date(log.timestamp).toISOString().slice(0, 10))
  );

  // Weekly (this week)
  const weeklyActivity = groupBy(
    filterLogs(startOfWeek, new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000), logs),
    (log) => {
      const ts = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      const year = ts.getFullYear();
      const week = Math.ceil(((ts.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
      return `${year}-W${week}`;
    }
  );

  // Monthly (this month)
  const monthlyActivity = groupBy(
    filterLogs(startOfMonth, new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1), logs),
    (log) => {
      const ts = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      return `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
    }
  );

  return NextResponse.json({
    dailyActivity,
    weeklyActivity,
    monthlyActivity,
  });
}
