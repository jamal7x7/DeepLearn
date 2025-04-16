// Removed 'use client'; this is now a pure Server Component

import DashboardHeroStats from '@/components/dashboard-hero-stats';
import LatestAnnouncementCard from '@/components/latest-announcement-card';
import AllAnnouncementsWidget from '@/components/all-announcements-widget';
import StudentActivityWidget from '@/components/StudentActivityWidget';
import { AnnouncementCardProps } from '@/components/AnnouncementCard';
import { cookies } from 'next/headers';

// Types
export type Announcement = AnnouncementCardProps;
export type TeamData = {
  id: number;
  name: string;
  memberCount: number;
};
export type ActivityData = {
  day: string;
  visits: number;
};
export type DashboardData = {
  announcements: Announcement[];
  teams: TeamData[];
  activityData: ActivityData[];
  weeklyData: ActivityData[];
  monthlyData: ActivityData[];
  totalStudents: number;
};

export default async function TeacherDashboardPage() {
  // Fetch announcements for the user from the backend API (Server Component: must use absolute URL and forward cookies)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cookieHeader = cookies().toString();

  const [announcementsRes, teamsRes, activityRes, totalStudentsRes] = await Promise.all([
    fetch(`${baseUrl}/api/user/announcements`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      credentials: 'include',
    }),
    fetch(`${baseUrl}/api/user/teams`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      credentials: 'include',
    }),
    fetch(`${baseUrl}/api/user/activity`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      credentials: 'include',
    }),
    fetch(`${baseUrl}/api/user/total-students`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      credentials: 'include',
    }),
  ]);

  let announcements: Announcement[] = [];
  let teams: TeamData[] = [];
  let activityData: ActivityData[] = [];
  let totalStudents: number = 0;

  if (announcementsRes.ok) {
    const announcementsJson = await announcementsRes.json();
    announcements = Array.isArray(announcementsJson)
      ? announcementsJson
      : announcementsJson.announcements || [];
  }
  if (teamsRes.ok) {
    teams = await teamsRes.json();
  }
  if (activityRes.ok) {
    activityData = await activityRes.json();
  }
  if (totalStudentsRes.ok) {
    const total = await totalStudentsRes.json();
    totalStudents = typeof total === 'number' ? total : total.totalStudents;
  }

  // Calculate weekly and monthly data from activityData (simple mock aggregation)
  const weeklyData = activityData.slice(-7);
  const monthlyData = activityData.slice(-30);

  // Announcement categorization (server-side)
  const currentTeacherEmail: string = announcements[0]?.email || '';
  const myAnnouncements: Announcement[] = announcements.filter(a => a.email === currentTeacherEmail);
  const adminAnnouncements: Announcement[] = announcements.filter(a => (a.sender || '').toLowerCase().includes('admin'));
  const otherTeacherAnnouncements: Announcement[] = announcements.filter(a => a.email !== currentTeacherEmail && !(a.sender || '').toLowerCase().includes('admin'));

  // Set user email in localStorage for client badge logic
  // Only render on client side
  // eslint-disable-next-line @next/next/no-assign-module-variable
  const SetUserEmail = (await import("@/components/set-user-email")).SetUserEmail;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Set user email in localStorage for client badge logic */}
      <SetUserEmail email={currentTeacherEmail} />
      {/* Hero Stats Bar */}
      <DashboardHeroStats
        totalStudents={totalStudents}
        engagementRate={calculateEngagementRate(activityData, totalStudents)}
        teamActivity={calculateTeamActivity(weeklyData)}
        isRTL={false}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Engagement Widget on the right (col-span-1) */}
        <div className=" order-2 md:order-3 md:col-span-1">
          <StudentActivityWidget dailyData={activityData} weeklyData={weeklyData} monthlyData={monthlyData} />
        </div>
        {/* Latest Announcement in an attractive container, 2/3 width below the hero bar */}
        <div className="order-1 md:order-1 md:col-span-2 flex flex-col gap-6">
          <section className="mt-2">
            <LatestAnnouncementCard announcement={myAnnouncements[0] || adminAnnouncements[0] || null} isRTL={false} />
            <AllAnnouncementsWidget
              myAnnouncements={myAnnouncements}
              adminAnnouncements={adminAnnouncements}              otherTeacherAnnouncements={otherTeacherAnnouncements}
              isRTL={false}
            />
          </section>
          {/* Team Activity Widget (optional: can be moved below announcement if needed) */}
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between">
                <span className="text-sm">{team.name}</span>
                <span className="text-sm font-medium">{team.memberCount} Students</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper functions for stats (server-side, pure functions)
function calculateEngagementRate(activityData: ActivityData[], totalStudents: number): number {
  if (!activityData.length || !totalStudents) return 0;
  const totalVisits = activityData.reduce((sum, day) => sum + day.visits, 0);
  return Math.round((totalVisits / (totalStudents * activityData.length)) * 100);
}
function calculateTeamActivity(weeklyData: ActivityData[]): number {
  if (!weeklyData.length) return 0;
  return weeklyData.reduce((sum, day) => sum + day.visits, 0);
}