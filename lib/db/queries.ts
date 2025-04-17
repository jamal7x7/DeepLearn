import { desc, and, eq, isNull, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, TeamMember } from './schema'; // Added TeamMember import
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

/**
 * Update a team's name by ID.
 */
export async function updateTeamName(teamId: number, newName: string) {
  await db
    .update(teams)
    .set({
      name: newName,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
      teamRole: teamMembers.role,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser(userId: number) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

/**
 * Get all teams for a user, optionally filtered by role.
 * @param userId number
 * @param role string | undefined (e.g. "teacher" or "student")
 */
export async function getTeamsForUser(userId: number, role?: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: true,
        },
      },
    },
  });

  // Filter by role in JS if provided
  const teamMembersArr = (result as any)?.teamMembers as Array<{ role: string; team: any }> | undefined;
  if (!teamMembersArr) return [];
  const filtered = role ? teamMembersArr.filter(tm => tm.role === role) : teamMembersArr;
  // Sort by team.order ASC, fallback to id ASC
  return filtered
    .map((tm: { team: any }) => tm.team)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id - b.id));
}

/**
 * Get specific team memberships for a user.
 * @param userId number
 * @param teamIds number[]
 */
export async function getUserMembershipsInTeams(userId: number, teamIds: number[]): Promise<TeamMember[]> {
  if (!teamIds || teamIds.length === 0) {
    return [];
  }
  return db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), inArray(teamMembers.teamId, teamIds)));
}

/**
 * Get all members for a specific team with their user details.
 * @param teamId number
 */
export async function getTeamMembersWithUserDetails(teamId: number) {
  return db
    .select({
      userId: teamMembers.userId,
      role: teamMembers.role,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        isFrozen: users.isFrozen,
        // image: users.image, // Removed as 'image' column doesn't exist in schema
      },
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, teamId), isNull(users.deletedAt))); // Exclude deleted users
}
