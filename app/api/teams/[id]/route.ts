export const runtime = 'nodejs';


import { NextRequest, NextResponse } from "next/server";
import { eq, and } from 'drizzle-orm';

import { db } from "@/lib/db/drizzle";
import { teams, teamMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const teamId = Number(context.params.id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
    }
    // Only allow removal if user is a teacher or admin of the team
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.userId, session.user.id), eq(teamMembers.teamId, teamId)),
    });
    if (!membership || (membership.role !== "teacher" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Remove all team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    // Remove the team
    await db.delete(teams).where(eq(teams.id, teamId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
