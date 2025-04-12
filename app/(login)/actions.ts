'use server';

import { z } from 'zod';
import { and, eq, or, gte, lt, sql, SQL } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  teams,
  teamMembers,
  activityLogs,
  type NewUser,
  type NewTeam,
  type NewTeamMember,
  type NewActivityLog,
  ActivityType,
  invitations,
  invitationCodes,
  invitationCodeUses,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';

export async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string,
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithTeam = await db
    .select({
      user: users,
      team: teams,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithTeam.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const { user: foundUser, team: foundTeam } = userWithTeam[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash,
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const [fullUser] = await db.select().from(users).where(eq(users.id, foundUser.id));

  await Promise.all([
    setSession(fullUser),
    logActivity(foundTeam?.id, foundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: foundTeam, priceId });
  }

  redirect(fullUser.role === 'student' ? '/dashboard/student' : '/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  invitationCode: z.string().optional(),
  role: z.enum(['student', 'teacher', 'admin', 'dev']).default('student'),
  redirect: z.string().optional(),
  priceId: z.string().optional(),
});

export const signUp = validatedAction(
  signUpSchema,
  async (data, formData) => {
    const { email, password, inviteId, invitationCode, role } = data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: 'User already exists', email, password };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [createdUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role,
      })
      .returning();

    if (!createdUser) {
      return { error: 'Failed to create user', email, password };
    }

    // Create or join team
    let teamId: number;
    let userRole = role;
    let createdTeam: typeof teams.$inferSelect | null = null;

    // Check for invitation code first (new feature)
    if (invitationCode) {
      // Find the invitation code
      const code = await db.query.invitationCodes.findFirst({
        where: and(
          eq(invitationCodes.code, invitationCode),
          eq(invitationCodes.isActive, true),
          // Check if code is not expired or has no expiration
          or(
            eq(invitationCodes.expiresAt, sql`null`),
            gte(invitationCodes.expiresAt, new Date())
          ),
          // Check if code has not reached max uses
          or(
            eq(invitationCodes.maxUses, sql`null`),
            lt(invitationCodes.usedCount, invitationCodes.maxUses)
          )
        ),
        with: {
          team: true
        }
      });

      if (code) {
        teamId = code.teamId;
        userRole = 'student'; // Default role for users joining via code

        // Record the code usage in a transaction
        await db.transaction(async (tx) => {
          // Add user to the team
          await tx.insert(teamMembers).values({
            userId: createdUser.id,
            teamId: code.teamId,
            role: userRole,
          });
          
          // Record the code usage
          await tx.insert(invitationCodeUses).values({
            codeId: code.id,
            userId: createdUser.id,
          });
          
          // Increment the used count
          await tx.update(invitationCodes)
            .set({ usedCount: code.usedCount + 1 })
            .where(eq(invitationCodes.id, code.id));
          
          // If code has reached max uses, deactivate it
          if (code.maxUses && code.usedCount + 1 >= code.maxUses) {
            await tx.update(invitationCodes)
              .set({ isActive: false })
              .where(eq(invitationCodes.id, code.id));
          }
        });

        await logActivity(teamId, createdUser.id, ActivityType.JOIN_TEAM_WITH_CODE);

        [createdTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId));
      } else {
        return { error: 'Invalid or expired invitation code.', email, password };
      }
    } else if (inviteId) {
      // Check if there's a valid invitation
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.id, parseInt(inviteId)),
            eq(invitations.email, email),
            eq(invitations.status, 'pending'),
          )
        )
        .limit(1);

      if (invitation) {
        teamId = invitation.teamId;
        userRole = invitation.role as "student" | "admin" | "teacher" | "dev";

        await db
          .update(invitations)
          .set({ status: 'accepted' })
          .where(eq(invitations.id, invitation.id));

        await logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION);

        [createdTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, teamId))
          .limit(1);
      } else {
        return { error: 'Invalid or expired invitation.', email, password };
      }
    } else {
      // Create a new team if there's no invitation
      const newTeam: NewTeam = {
        name: `${email}'s Team`,
      };

      [createdTeam] = await db.insert(teams).values(newTeam).returning();

      if (!createdTeam) {
        return {
          error: 'Failed to create team. Please try again.',
          email,
          password,
        };
      }

      teamId = createdTeam.id;
      
      // Log team creation
      await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
    }

    // Add user to team
    const newTeamMember: NewTeamMember = {
      userId: createdUser.id,
      teamId: teamId,
      role: userRole,
    };

    await Promise.all([
      db.insert(teamMembers).values(newTeamMember),
      logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
    ]);

    // Set session
    await setSession(createdUser);

    // Handle redirect to checkout if priceId is provided
    const priceId = data.priceId as string;
    if (priceId) {
      return createCheckoutSession({ team: createdTeam, priceId });
    }

    // Redirect to dashboard
    redirect(createdUser.role === 'student' ? '/dashboard/student' : '/dashboard');
  }
);

export async function signOut() {
  const user = await getUser();
  if (!user) {
    (await cookies()).delete('session');
    return;
  }
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.teamId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return { error: 'Current password is incorrect.' };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from the current password.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return { success: 'Password updated successfully.' };
  },
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return { error: 'Incorrect password. Account deletion failed.' };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT,
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`, // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.teamId) {
      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, user.id),
            eq(teamMembers.teamId, userWithTeam.teamId),
          ),
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  },
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT),
    ]);

    return { success: 'Account updated successfully.' };
  },
);

const removeTeamMemberSchema = z.object({
  memberId: z.number(),
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      );

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER,
    );

    return { success: 'Team member removed successfully' };
  },
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(teamMembers.teamId, userWithTeam.teamId),
        ),
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this team' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.teamId, userWithTeam.teamId),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    await db.insert(invitations).values({
      teamId: userWithTeam.teamId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending',
    });

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER,
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithTeam.team.name, role)

    return { success: 'Invitation sent successfully' };
  },
);
