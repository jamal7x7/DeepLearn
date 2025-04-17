import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const orderSchema = z.object({
  orderedIds: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }
    const { orderedIds } = parsed.data;
    // Get all team IDs where the user is a member
    const userTeams = await db.query.teamMembers.findMany({
      columns: { teamId: true },
      where: (teamMembers, { eq }) => eq(teamMembers.userId, session.user.id),
    });
    const userTeamIds = userTeams.map(t => t.teamId);
    // Only update order for teams the user is a member of
    for (let i = 0; i < orderedIds.length; i++) {
      const teamId = orderedIds[i];
      if (userTeamIds.includes(teamId)) {
        await db.update(teams).set({ order: i }).where(eq(teams.id, teamId));
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
