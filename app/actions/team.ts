"use server";

import { db } from "@/lib/db/drizzle";
import { teamMembers, teams } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Server action to remove a team member
export async function removeTeamMember(teamId: number, userId: number) {
  await db.delete(teamMembers).where(
    and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
  );
  revalidatePath("/dashboard/team-members");
}

// Server action to delete a team
export async function removeTeam(teamId: number) {
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/dashboard/team-members");
}