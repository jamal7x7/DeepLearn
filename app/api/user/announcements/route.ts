export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { announcements, announcementRecipients, teamMembers, teams, users } from '@/lib/db/schema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    console.log('DEBUG: Session', session);
    if (!session?.user?.id) {
      console.log('DEBUG: Unauthorized - no session user');
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
        or(
          and(eq(teamMembers.userId, userId), eq(announcementRecipients.teamId, teams.id)),
          ilike(users.name, '%admin%')
        )
      )
      .orderBy(desc(announcements.createdAt));

    console.log('DEBUG: Announcements data', userAnnouncements);

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
    console.error('DEBUG: Error in announcements endpoint', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}