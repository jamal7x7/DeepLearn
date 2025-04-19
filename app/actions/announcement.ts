'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  announcements,
  announcementRecipients,
  activityLogs,
  TeamMember, // Import TeamMember type
  users, // Add users import
} from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session'; // Correct import for session
import { ActivityType } from '@/lib/db/schema';
import { getUserMembershipsInTeams } from '@/lib/db/queries'; // Correct import for query

interface SendAnnouncementResult {
  success: boolean;
  message: string;
  announcementId?: number;
}

export async function sendAnnouncementAction(
  content: string,
  teamIds: number[],
  type: "plain" | "mdx",
): Promise<SendAnnouncementResult> {
  const session = await getSession(); // Use getSession
  // Adjust check for session structure from getSession
  if (!session?.user?.id || typeof session.user.id !== 'number') {
    return { success: false, message: 'User not authenticated.' };
  }
  const userId = session.user.id; // ID is already a number

  if (!content.trim()) {
    return { success: false, message: 'Announcement content cannot be empty.' };
  }
  if (!teamIds || teamIds.length === 0) {
    return { success: false, message: 'Please select at least one team.' };
  }
try {
  // 1. Verify the user is a teacher/admin in ALL selected teams
  const userMemberships = await getUserMembershipsInTeams(userId, teamIds);

  // Check if user is admin
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const isAdmin = user?.role === 'admin';

  // If user is admin, they can send announcements to any team
  if (!isAdmin) {
    // Check if the user is a member of all requested teams
    if (userMemberships.length !== teamIds.length) {
        return { success: false, message: 'You are not a member of all selected teams.' };
    }

    // Check if the user has the required role ('teacher' or 'admin') in all those teams
    const hasPermissionInAllTeams = userMemberships.every(
        (membership: TeamMember) => membership.role === 'teacher' || membership.role === 'admin'
    );

    if (!hasPermissionInAllTeams) {
        return { success: false, message: `You do not have permission to send announcements to some selected teams.` };
    }
  }

  // Old logic was here and is now fully removed.
  // }


    // 2. Create the announcement
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        senderId: userId,
        content: content.trim(),
        type,
      })
      .returning({ id: announcements.id });

    if (!newAnnouncement?.id) {
      throw new Error('Failed to create announcement record.');
    }

    // 3. Link announcement to recipient teams
    const recipientData = teamIds.map((teamId) => ({
      announcementId: newAnnouncement.id,
      teamId: teamId,
    }));

    await db.insert(announcementRecipients).values(recipientData);

    // 4. Log activity (optional, adjust based on your logging needs)
    // Log one entry per team for granularity, or one general entry
    const logEntries = teamIds.map(teamId => ({
        teamId: teamId,
        userId: userId,
        action: ActivityType.SEND_ANNOUNCEMENT,
        // Optionally add more details like announcement ID or content snippet
    }));
    await db.insert(activityLogs).values(logEntries);


    // 5. Revalidate relevant paths if needed (e.g., a page displaying announcements)
    // revalidatePath('/dashboard/announcements'); // Example path

    return {
      success: true,
      message: 'Announcement sent successfully.',
      announcementId: newAnnouncement.id,
    };
  } catch (error) {
    console.error('Error sending announcement:', error);
    return {
      success: false,
      message: 'An error occurred while sending the announcement.',
    };
  }
}