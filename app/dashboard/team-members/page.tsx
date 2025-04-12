import { Users } from "lucide-react";
import { db } from "@/lib/db/drizzle";
import { teamMembers, users, teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import TeamMembersClient from "@/components/TeamMembersClient";

export default async function TeamMembersPage() {
  const session = await getSession();
  if (!session) {
    return <div className="p-6">You must be signed in to view team members.</div>;
  }

  const userTeamMemberships = await db
    .select({
      teamId: teamMembers.teamId,
      teamName: teams.name,
      userRole: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, session.user.id));

  if (!userTeamMemberships.length) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-center">
        <Users className="h-10 w-10 text-muted-foreground mb-2" />
        <div className="text-lg font-semibold">No Team Memberships</div>
        <div className="text-muted-foreground">You are not a member of any team.</div>
      </div>
    );
  }

  const teamData = await Promise.all(
    userTeamMemberships.map(async (membership) => {
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: teamMembers.role,
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, membership.teamId));
      return {
        teamId: membership.teamId,
        teamName: membership.teamName,
        userRole: membership.userRole,
        members,
      };
    })
  );

  return (
    <div className="p-6">
      <TeamMembersClient teams={teamData} />
    </div>
  );
}