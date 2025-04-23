// Server Component: delegates all client logic/UI to AnnouncementsDashboardClient
import { AnnouncementsDashboardClient } from './AnnouncementsDashboardClient';
import { getAllAnnouncements, getAnnouncementStats } from '@/app/actions/announcement';
import { fetchAuditLogs } from '@/app/actions/audit-log';
import { getTeams } from '@/app/actions/team';
import { getUsers } from '@/app/actions/user';
import { getSession } from '@/lib/auth/session';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Announcements',
};

export default async function AnnouncementsDashboardPage() {
  // Fetch all necessary server-side data
  const [announcementsRaw, statsRaw, auditLogsRaw, teamsRaw, users, session] = await Promise.all([
    getAllAnnouncements(),
    getAnnouncementStats(),
    fetchAuditLogs(),
    getTeams(),
    getUsers(),
    getSession(),
  ]);

  // Transform announcements to match AnnouncementCardProps
  const announcements = (announcementsRaw || []).map((a: any) => ({
    id: a.id,
    teamId: a.teamId ?? 0,
    teamName: a.teamName ?? '',
    content: a.content,
    sentAt: a.createdAt ? new Date(a.createdAt).toISOString() : '',
    sender: a.sender ?? '',
    senderName: a.senderName ?? '',
    email: a.email ?? '',
    type: a.type ?? 'plain',
    message: a.message ?? undefined,
  }));

  // Transform stats to match expected shape, using safe defaults
  const stats = {
    totalAnnouncements: statsRaw.total ?? 0,
    unreadAnnouncements: statsRaw.unreadAnnouncements ?? 0,
    announcementsToday: statsRaw.announcementsToday ?? 0,
  };

  // Ensure auditLogs is an array
  const auditLogs = Array.isArray(auditLogsRaw.logs) ? auditLogsRaw.logs : (Array.isArray(auditLogsRaw) ? auditLogsRaw : []);

  // Transform teams to match Team interface
  const teams = (teamsRaw || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    memberCount: t.memberCount ?? 0,
    createdAt: t.createdAt ?? '',
  }));

  return (
    <AnnouncementsDashboardClient
      announcements={announcements}
      stats={stats}
      teams={teams}
      users={users}
      session={session}
    />
  );
}