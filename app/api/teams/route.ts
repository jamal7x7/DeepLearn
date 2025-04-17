import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { teams, teamMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["class", "club", "study group", "other"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, type } = parsed.data;
    // Find the max order for teams where the user is a member
    const userTeams = await db.query.teamMembers.findMany({
      columns: { teamId: true },
      where: (teamMembers, { eq }) => eq(teamMembers.userId, session.user.id),
    });
    const userTeamIds = userTeams.map(t => t.teamId);
    let maxOrder = -1;
    if (userTeamIds.length > 0) {
      const maxOrderResult = await db.query.teams.findMany({
        columns: { order: true },
        where: (teams, { inArray }) => inArray(teams.id, userTeamIds),
        orderBy: (teams, { desc }) => desc(teams.order),
        limit: 1,
      });
      maxOrder = maxOrderResult[0]?.order ?? -1;
    }
    // Create the team with incremented order
    const [team] = await db.insert(teams).values({ name, type, order: maxOrder + 1 }).returning();
    // Add the creator as a teacher
    await db.insert(teamMembers).values({
      userId: session.user.id,
      teamId: team.id,
      role: "teacher",
    });
    return NextResponse.json({ success: true, team });
  } catch (error) {
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
