import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invitationCodes } from '@/lib/db/schema';
import { and, eq, or, gte, lt, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// API route to validate an invitation code without requiring authentication
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 });
    }
    
    // Find the invitation code
    const invitationCode = await db.query.invitationCodes.findFirst({
      where: and(
        eq(invitationCodes.code, code),
        eq(invitationCodes.isActive, true),
        // Check if code is not expired or has no expiration
        or(
          isNull(invitationCodes.expiresAt),
          gte(invitationCodes.expiresAt, new Date())
        ),
        // Check if code has not reached max uses
        or(
          isNull(invitationCodes.maxUses),
          lt(invitationCodes.usedCount, invitationCodes.maxUses)
        )
      ),
      with: {
        team: true
      }
    });
    
    if (!invitationCode) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired invitation code' }, { status: 200 });
    }
    
    return NextResponse.json({ 
      valid: true, 
      teamName: invitationCode.team.name,
      message: 'Valid invitation code'
    });
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return NextResponse.json({ error: 'An error occurred while validating the invitation code' }, { status: 500 });
  }
}

// API route to get all active invitation codes for a team
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    
    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    const codes = await db.query.invitationCodes.findMany({
      where: and(
        eq(invitationCodes.teamId, parseInt(teamId)),
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
    
    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Error fetching invitation codes:', error);
    return NextResponse.json({ error: 'An error occurred while fetching invitation codes' }, { status: 500 });
  }
}