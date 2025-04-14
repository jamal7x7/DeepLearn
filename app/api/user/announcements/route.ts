import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { announcements, announcementRecipients, teamMembers, teams, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all announcements for teams the user is a member of
    const userAnnouncements = await db
      .select({
        id: announcements.id,
        content: announcements.content,
        message: announcements.content,
        sentAt: announcements.createdAt,
        teamName: teams.name,
        name: users.name,
        email: users.email,
        type: announcements.type,
      })
      .from(teamMembers)
      .innerJoin(
        teams,
        eq(teams.id, teamMembers.teamId)
      )
      .innerJoin(
        announcementRecipients,
        eq(announcementRecipients.teamId, teams.id)
      )
      .innerJoin(
        announcements,
        eq(announcements.id, announcementRecipients.announcementId)
      )
      .innerJoin(
        users,
        eq(users.id, announcements.senderId)
      )
      .where(
        eq(teamMembers.userId, userId)
      )
      .orderBy(desc(announcements.createdAt));

    // Remove duplicate announcements by id and set sender fallback
    const uniqueAnnouncements = [];
    const seenIds = new Set();
    for (const a of userAnnouncements) {
      if (!seenIds.has(a.id)) {
        uniqueAnnouncements.push({
          ...a,
          sender: a.name || a.email,
        });
        seenIds.add(a.id);
      }
    }
    return NextResponse.json({ announcements: uniqueAnnouncements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}