export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { getSession } from '@/lib/auth/session';
import { announcements, teamMembers, teams, announcementRecipients, users } from '@/lib/db/schema';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teamId from URL
    const url = new URL(request.url);
    const teamId = parseInt(url.searchParams.get('teamId') || '');
    
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if the user is an admin
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isAdmin = user.length > 0 && user[0].role === 'admin';

    // If not admin, verify user is a member of the team
    if (!isAdmin) {
      const teamMembership = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId),
          //   eq(teamMembers.active, true)
          )
        )
        .limit(1);

      if (teamMembership.length === 0) {
        return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
      }
    }

    // Get announcements for the specific team
    const teamAnnouncements = await db
      .select({
        id: announcements.id,
        content: announcements.content,
        sentAt: announcements.createdAt,
        teamName: teams.name,
        sender: users.name, // Use user's name from the users table
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
        eq(announcementRecipients.teamId, teamId)
      )
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json({ announcements: teamAnnouncements });
  } catch (error) {
    console.error('Error fetching team announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId, content } = body;

    if (!announcementId || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch the announcement to check permissions
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Only the sender or an admin/teacher can edit
    if (announcement.senderId !== session.user.id) {
      // Optionally, check for admin/teacher role here
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .update(announcements)
      .set({ content })
      .where(eq(announcements.id, announcementId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}
