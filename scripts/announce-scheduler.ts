import { db } from '../lib/db/drizzle';
import { announcements, announcementRecipients } from '../lib/db/schema';
import { eq, and, isNull, lte } from 'drizzle-orm';

/**
 * This script finds all scheduled announcements that should go live (schedule <= now, notifiedAt IS NULL),
 * marks them as notified, and (optionally) triggers notification logic (e.g. email, in-app).
 *
 * Run this script via a cron job every minute for real-time scheduling.
 */
async function processScheduledAnnouncements() {
  const now = new Date();
  // Find all announcements where schedule is set, schedule <= now, and not yet notified
  const toNotify = await db
    .select()
    .from(announcements)
    .where(and(
      lte(announcements.schedule, now),
      isNull(announcements.notifiedAt),
      // Only process if schedule is not null
      lte(announcements.schedule, now)
    ));

  for (const ann of toNotify) {
    // Mark as notified
    await db.update(announcements)
      .set({ notifiedAt: now })
      .where(eq(announcements.id, ann.id));

    // Optionally: Trigger notification logic here (email, in-app, etc)
    // Example: console.log(`Notify for announcement ${ann.id}`);
  }

  if (toNotify.length) {
    console.log(`Processed ${toNotify.length} scheduled announcement(s).`);
  }
}

// Run the processor
processScheduledAnnouncements().then(() => process.exit(0));
