'use server';

import { z } from 'zod';
import { eq, and, lt, gte, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db/drizzle';
import { invitationCodes, invitationCodeUses, teamMembers, teams, ActivityType } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam } from '@/lib/db/queries';
import { logActivity } from '@/app/(login)/actions';

// Schema for generating a new invitation code
const generateInvitationCodeSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  maxUses: z.coerce.number().int().min(1).optional(),
  expiresInHours: z.coerce.number().int().min(1).optional(),
});

// Generate a unique invitation code for a team
export const generateInvitationCode = validatedActionWithUser(
  generateInvitationCodeSchema,
  async (data, _, user) => {
    // Check if user is a teacher or has permission to create codes
    if (user.role !== 'teacher' && user.role !== 'owner') {
      return { error: 'Only teachers can generate invitation codes' };
    }

    // Find or create the team by name
    let team = await db.query.teams.findFirst({
      where: eq(teams.name, data.teamName),
    });

    if (!team) {
      // Create the team if it doesn't exist
      const [newTeam] = await db.insert(teams).values({
        name: data.teamName,
      }).returning();
      team = newTeam;
      // Add the teacher as a member of the new team
      await db.insert(teamMembers).values({
        userId: user.id,
        teamId: team.id,
        role: "teacher",
      });
    }
    if (!team) {
      return { error: "Failed to create or find team." };
    }

    // Generate a unique code (6 characters alphanumeric)
    const code = nanoid(6).toUpperCase();

    // Calculate expiration date if provided
    let expiresAt = null;
    if (data.expiresInHours) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + data.expiresInHours);
    }

    // Insert the new code
    const [newCode] = await db.insert(invitationCodes).values({
      teamId: team.id,
      code,
      createdBy: user.id,
      expiresAt,
      maxUses: data.maxUses || 1,
    }).returning();

    // Log the activity
    await logActivity(
      team.id,
      user.id,
      ActivityType.GENERATE_INVITATION_CODE,
      `Generated invitation code: ${code}`
    );

    return {
      success: 'Invitation code generated successfully',
      code: newCode.code,
      expiresAt: newCode.expiresAt,
      maxUses: typeof newCode.maxUses === 'number' ? newCode.maxUses : undefined
    };
  }
);

// Schema for validating an invitation code
const validateInvitationCodeSchema = z.object({
  code: z.string().min(1),
});

// Validate an invitation code and return team information
export const validateInvitationCode = validatedActionWithUser(
  validateInvitationCodeSchema,
  async (data, _, user) => {
    const { code } = data;
    
    // Find the invitation code
    const invitationCode = await db.query.invitationCodes.findFirst({
      where: and(
        eq(invitationCodes.code, code),
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
    
    if (!invitationCode) {
      return { error: 'Invalid or expired invitation code' };
    }
    
    return { 
      success: 'Valid invitation code',
      teamId: invitationCode.teamId,
      teamName: invitationCode.team.name
    };
  }
);

// Schema for joining a team with an invitation code
const joinTeamWithCodeSchema = z.object({
  code: z.string().min(1),
});

// Join a team using an invitation code
export const joinTeamWithCode = validatedActionWithUser(
  joinTeamWithCodeSchema,
  async (data, _, user) => {
    const { code } = data;
    
    // Find the invitation code
    const invitationCode = await db.query.invitationCodes.findFirst({
      where: and(
        eq(invitationCodes.code, code),
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
      )
    });
    
    if (!invitationCode) {
      return { error: 'Invalid or expired invitation code' };
    }
    
    // Check if user is already a member of this team
    const existingMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, user.id),
        eq(teamMembers.teamId, invitationCode.teamId)
      )
    });
    
    if (existingMembership) {
      return { error: 'You are already a member of this team' };
    }
    
    // Start a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      // Add user to the team
      await tx.insert(teamMembers).values({
        userId: user.id,
        teamId: invitationCode.teamId,
        role: 'student', // Default role for users joining via code
      });
      
      // Record the code usage
      await tx.insert(invitationCodeUses).values({
        codeId: invitationCode.id,
        userId: user.id,
      });
      
      // Increment the used count
      await tx.update(invitationCodes)
        .set({ usedCount: invitationCode.usedCount + 1 })
        .where(eq(invitationCodes.id, invitationCode.id));
      
      // If code has reached max uses, deactivate it
      if (invitationCode.maxUses && invitationCode.usedCount + 1 >= invitationCode.maxUses) {
        await tx.update(invitationCodes)
          .set({ isActive: false })
          .where(eq(invitationCodes.id, invitationCode.id));
      }
    });
    
    // Log the activity
    await logActivity(
      invitationCode.teamId,
      user.id,
      ActivityType.JOIN_TEAM_WITH_CODE
    );
    
    return { success: 'Successfully joined the team' };
  }
);

// Get all active invitation codes for a team
export async function getTeamInvitationCodes(teamId: number) {
  return await db.query.invitationCodes.findMany({
    where: and(
      eq(invitationCodes.teamId, teamId),
      eq(invitationCodes.isActive, true)
    ),
    orderBy: (invitationCodes, { desc }) => [desc(invitationCodes.createdAt)],
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

// Revoke an invitation code
export const revokeInvitationCode = validatedActionWithUser(
  z.object({ codeId: z.coerce.number() }),
  async (data, _, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    
    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }
    
    // Check if user is a teacher or has permission
    if (user.role !== 'teacher' && user.role !== 'owner') {
      return { error: 'Only teachers can revoke invitation codes' };
    }
    
    // Find the code and ensure it belongs to the user's team
    const code = await db.query.invitationCodes.findFirst({
      where: and(
        eq(invitationCodes.id, data.codeId),
        eq(invitationCodes.teamId, userWithTeam.teamId)
      )
    });
    
    if (!code) {
      return { error: 'Invitation code not found' };
    }
    
    // Revoke the code
    await db.update(invitationCodes)
      .set({ isActive: false })
      .where(eq(invitationCodes.id, data.codeId));
    
    return { success: 'Invitation code revoked successfully' };
  }
);