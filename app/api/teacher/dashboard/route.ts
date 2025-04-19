export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { eq, and, desc, count, sql, gte, lt } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { announcements, announcementRecipients, teamMembers, teams, users, activityLogs } from '@/lib/db/schema';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user is a teacher
    const [userRole] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRole || userRole.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all teams where the user is a member with role 'teacher'
    const teacherTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teams.id, teamMembers.teamId))
      .where(
        and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.role, 'teacher')
        )
      );

    // Get team IDs
    const teamIds = teacherTeams.map(team => team.id);

    // If no teams, return empty data
    if (teamIds.length === 0) {
      return NextResponse.json({
        teams: [],
        announcements: [],
        totalStudents: 0,
        activityData: []
      });
    }

    // Get all announcements for these teams
    const teacherAnnouncements = await db
      .select({
        id: announcements.id,
        content: announcements.content,
        sentAt: announcements.createdAt,
        teamName: teams.name,
        teamId: teams.id,
        sender: users.name,
        email: users.email,
        type: announcements.type,
      })
      .from(announcementRecipients)
      .innerJoin(
        announcements,
        eq(announcements.id, announcementRecipients.announcementId)
      )
      .innerJoin(
        teams,
        eq(teams.id, announcementRecipients.teamId)
      )
      .innerJoin(
        users,
        eq(users.id, announcements.senderId)
      )
      .where(
        sql`${announcementRecipients.teamId} IN ${teamIds}`
      )
      .orderBy(desc(announcements.createdAt));

    // Count students in each team
    const teamStudentCounts = await db
      .select({
        teamId: teamMembers.teamId,
        studentCount: count(teamMembers.id),
      })
      .from(teamMembers)
      .where(
        and(
          sql`${teamMembers.teamId} IN ${teamIds}`,
          eq(teamMembers.role, 'student')
        )
      )
      .groupBy(teamMembers.teamId);

    // Get real student activity data from activity logs
    // Get daily activity data (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const activityLogsResult = await db
      .select({
        date: sql`DATE(${activityLogs.timestamp})`,
        count: count(activityLogs.id), // Count distinct activity log IDs to avoid double counting
      })
      .from(activityLogs)
      .where(
        and(
          sql`${activityLogs.teamId} IN ${teamIds}`,
          gte(activityLogs.timestamp, sevenDaysAgo),
          lt(activityLogs.timestamp, new Date(today.getTime() + 86400000)) // Add one day to include today
        )
      )
      .groupBy(sql`DATE(${activityLogs.timestamp})`)
      .orderBy(sql`DATE(${activityLogs.timestamp})`);

    // Format daily data
    const dailyData = activityLogsResult.map(log => {
      // Ensure proper date parsing by handling potential string format issues
      const date = log.date instanceof Date ? log.date : new Date(String(log.date));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day: dayName,
        visits: Number(log.count),
      };
    });

    // Get weekly data (last 4 weeks)
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);
    
    // Use a more compatible approach for weekly data
    const weeklyLogsResult = await db
      .select({
        week: sql`DATE_TRUNC('week', ${activityLogs.timestamp})`,
        count: count(activityLogs.id), // Count distinct activity log IDs to avoid double counting
      })
      .from(activityLogs)
      .where(
        and(
          sql`${activityLogs.teamId} IN ${teamIds}`,
          gte(activityLogs.timestamp, fourWeeksAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${activityLogs.timestamp})`)
      .orderBy(sql`DATE_TRUNC('week', ${activityLogs.timestamp})`);

    // Process weekly data
    const weeklyMap = new Map();
    weeklyLogsResult.forEach(log => {
      const weekDate = log.week instanceof Date ? log.week : new Date(String(log.week));
      const weekKey = weekDate.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, 0);
      }
      weeklyMap.set(weekKey, Number(log.count));
    });

    // Convert to array and sort
    const weeklyData = Array.from(weeklyMap.entries()).map(([weekStart, count], index) => {
      const weekNum = Math.ceil((today.getTime() - new Date(weekStart).getTime()) / (7 * 24 * 60 * 60 * 1000));
      return {
        day: `W${weekNum}`,
        visits: count,
      };
    });

    // Get monthly data (last 6 months)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    // Use a more compatible approach for monthly data
    const monthlyLogsResult = await db
      .select({
        month: sql`DATE_TRUNC('month', ${activityLogs.timestamp})`,
        count: count(activityLogs.id), // Count distinct activity log IDs to avoid double counting
      })
      .from(activityLogs)
      .where(
        and(
          sql`${activityLogs.teamId} IN ${teamIds}`,
          gte(activityLogs.timestamp, sixMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${activityLogs.timestamp})`)
      .orderBy(sql`DATE_TRUNC('month', ${activityLogs.timestamp})`);

    // Process monthly data
    const monthlyMap = new Map();
    monthlyLogsResult.forEach(log => {
      const monthDate = log.month instanceof Date ? log.month : new Date(String(log.month));
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { date: monthDate, count: 0 });
      }
      monthlyMap.get(monthKey).count = Number(log.count);
    });

    // Convert to array and sort
    const monthlyData = Array.from(monthlyMap.values()).map(({ date, count }) => {
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      return {
        day: monthName,
        visits: count,
      };
    });

    // If no activity data found, provide empty arrays with day labels
    const emptyDailyData = dailyData.length > 0 ? dailyData : [
      { day: 'Mon', visits: 0 },
      { day: 'Tue', visits: 0 },
      { day: 'Wed', visits: 0 },
      { day: 'Thu', visits: 0 },
      { day: 'Fri', visits: 0 },
      { day: 'Sat', visits: 0 },
      { day: 'Sun', visits: 0 },
    ];
    
    // Log the processed data for debugging
    console.log('Daily data:', JSON.stringify(dailyData));
    console.log('Weekly data:', JSON.stringify(Array.from(weeklyMap.entries())));
    console.log('Monthly data:', JSON.stringify(Array.from(monthlyMap.entries())));
    
    // Ensure we're returning the correct data structures

    // Calculate total students
    const totalStudents = teamStudentCounts.reduce(
      (sum, team) => sum + Number(team.studentCount), 
      0
    );

    // Combine team data with student counts
    const teamsWithCounts = teacherTeams.map(team => {
      const countData = teamStudentCounts.find(t => t.teamId === team.id);
      return {
        ...team,
        memberCount: countData ? Number(countData.studentCount) : 0,
      };
    });

    return NextResponse.json({
      teams: teamsWithCounts,
      announcements: teacherAnnouncements,
      totalStudents,
      activityData: dailyData.length > 0 ? dailyData : emptyDailyData,
      weeklyData: weeklyData,
      monthlyData: monthlyData
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}