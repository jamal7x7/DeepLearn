'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import {
  announcements,
  announcementRecipients,
  activityLogs,
  TeamMember,
  users,
} from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session'; // Correct import for session
import { ActivityType } from '@/lib/db/schema';
import { getUserMembershipsInTeams } from '@/lib/db/queries'; // Correct import for query
import { updateAnnouncementSchema, reassignAnnouncementSchema } from '@/lib/announcement-schema';

interface SendAnnouncementResult {
  success: boolean;
  message: string;
  announcementId?: number;
}

interface LogAuditParams {
  action: string;
  userId: number;
  teamId: number;
  announcementId?: number;
  details?: string;
}

/**
 * Write an audit log entry for admin actions.
 */
async function logAudit({ action, userId, teamId, announcementId, details }: LogAuditParams) {
  try {
    await db.insert(auditLogs).values({ action, userId, teamId, announcementId, details });
  } catch (e) {
    // Non-blocking: log error but do not throw
    console.error('Audit log error:', e);
  }
}

export async function updateAnnouncementAction(id: number, content: string, type: string, teamId: number) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const validated = updateAnnouncementSchema.parse({ id, content, type, teamId });
    await db.update(announcements)
      .set({ content: validated.content, type: validated.type })
      .where(eq(announcements.id, validated.id));
    await db.delete(announcementRecipients).where(eq(announcementRecipients.announcementId, validated.id));
    await db.insert(announcementRecipients).values({ announcementId: validated.id, teamId: validated.teamId });
    revalidatePath('/dashboard/admin/announcements');
    await logAudit({ action: 'update', userId: session.user.id, teamId: validated.teamId, announcementId: validated.id, details: JSON.stringify({ content, type, teamId }) });
    return { success: true, message: 'Announcement updated.' };
  } catch (error) {
    console.error('Update announcement error:', error);
    return { success: false, message: 'Failed to update announcement.' };
  }
}

export async function deleteAnnouncementAction(id: number, teamId: number) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Unauthorized');
    await db.delete(announcements).where(eq(announcements.id, id));
    await db.delete(announcementRecipients).where(eq(announcementRecipients.announcementId, id));
    revalidatePath('/dashboard/admin/announcements');
    await logAudit({ action: 'delete', userId: session.user.id, teamId, announcementId: id });
    return { success: true, message: 'Announcement deleted.' };
  } catch (error) {
    console.error('Delete announcement error:', error);
    return { success: false, message: 'Failed to delete announcement.' };
  }
}

export async function reassignAnnouncementAction(id: number, teamIds: number[], teamId: number) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const validated = reassignAnnouncementSchema.parse({ id, teamIds });
    await db.delete(announcementRecipients).where(eq(announcementRecipients.announcementId, validated.id));
    await db.insert(announcementRecipients).values(
      validated.teamIds.map(teamId => ({ announcementId: validated.id, teamId }))
    );
    revalidatePath('/dashboard/admin/announcements');
    await logAudit({ action: 'reassign', userId: session.user.id, teamId, announcementId: validated.id, details: JSON.stringify({ teamIds }) });
    return { success: true, message: 'Announcement reassigned.' };
  } catch (error) {
    console.error('Reassign announcement error:', error);
    return { success: false, message: 'Failed to reassign announcement.' };
  }
}

export async function bulkDeleteAnnouncementsAction(ids: number[]) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Unauthorized');
    await db.delete(announcements).where(inArray(announcements.id, ids));
    await db.delete(announcementRecipients).where(inArray(announcementRecipients.announcementId, ids));
    revalidatePath('/dashboard/admin/announcements');
    await logAudit({ action: 'bulk_delete', userId: session.user.id, teamId: 0, announcementId: undefined, details: JSON.stringify({ ids }) });
    return { success: true, message: 'Announcements deleted.' };
  } catch (error) {
    console.error('Bulk delete error:', error);
    return { success: false, message: 'Failed to delete announcements.' };
  }
}

export async function bulkReassignAnnouncementsAction(ids: number[], teamIds: number[]) {
  try {
    const session = await getSession();
    if (!session?.user?.id) throw new Error('Unauthorized');
    for (const id of ids) {
      await db.delete(announcementRecipients).where(eq(announcementRecipients.announcementId, id));
      await db.insert(announcementRecipients).values(
        teamIds.map(teamId => ({ announcementId: id, teamId }))
      );
    }
    revalidatePath('/dashboard/admin/announcements');
    await logAudit({ action: 'bulk_reassign', userId: session.user.id, teamId: teamIds[0] ?? 0, announcementId: undefined, details: JSON.stringify({ ids, teamIds }) });
    return { success: true, message: 'Announcements reassigned.' };
  } catch (error) {
    console.error('Bulk reassign error:', error);
    return { success: false, message: 'Failed to reassign announcements.' };
  }
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

    await logAudit({ action: 'send_announcement', userId, teamId: teamIds[0], announcementId: newAnnouncement.id, details: JSON.stringify({ content, type, teamIds }) });
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

// --- Get All Announcements ---
/**
 * Fetch all announcements from the database.
 * @returns {Promise<any[]>} Array of announcements
 */
export async function getAllAnnouncements() {
  // TODO: Add filtering, pagination, and shape as needed
  return await db.select().from(announcements);
}

// --- Get Announcement Stats ---
/**
 * Fetch statistics about announcements (e.g., count, etc).
 * @returns {Promise<{ total: number; unreadAnnouncements: number; announcementsToday: number }>} Announcement stats
 */
export async function getAnnouncementStats(): Promise<{
  total: number;
  unreadAnnouncements: number;
  announcementsToday: number;
}> {
  // Total announcements
  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcements);
  const total = totalRows[0]?.count ?? 0;

  // Unread announcements (all users, unread in announcementRecipients)
  const unreadRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcementRecipients)
    .where(sql`"read_at" IS NULL`);
  const unreadAnnouncements = unreadRows[0]?.count ?? 0;

  // Announcements sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  const todayRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(announcements)
    .where(sql`"created_at" >= ${todayISO}`);
  const announcementsToday = todayRows[0]?.count ?? 0;

  return {
    total,
    unreadAnnouncements,
    announcementsToday,
  };
}