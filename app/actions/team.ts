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
/**
 * Server action to create a new team and add the user as a teacher.
 * @param teamName string
 * @param userId number
 */
export async function createTeamAction(teamName: string, userId: number) {
  if (!teamName || !userId) {
    return { error: "Missing team name or user ID." };
  }
  // Check if team already exists
  const existing = await db.query.teams.findFirst({
    where: eq(teams.name, teamName),
  });
  if (existing) {
    return { error: "A team with this name already exists." };
  }
  // Create the team
  const [newTeam] = await db.insert(teams).values({
    name: teamName,
  }).returning();
  // Add the user as a teacher member
  await db.insert(teamMembers).values({
    userId,
    teamId: newTeam.id,
    role: "teacher",
  });
  return { team: newTeam };
}