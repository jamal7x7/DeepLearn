import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { teams, teamMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Await params as per Next.js dynamic API route requirements
    const { params } = context;
    const teamId = Number(params.id);
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
