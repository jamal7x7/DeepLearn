import { NextResponse } from 'next/server';
import { getTeamMembersWithUserDetails } from '@/lib/db/queries'; // Use the new function
import { getSession } from '@/lib/auth/session'; // Use session for auth

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // TODO: Add role check - only teachers/admins should access this?

  const { searchParams } = new URL(request.url);
  const teamIdParam = searchParams.get('teamId');

  if (!teamIdParam) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }

  const teamId = parseInt(teamIdParam, 10);
  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid Team ID' }, { status: 400 });
  }

  try {
    // Fetch members for the specified team
    // Fetch members using the new function
    const teamMembers = await getTeamMembersWithUserDetails(teamId);

    if (!teamMembers) {
      return NextResponse.json({ students: [] });
    }

    // Filter for students and map to the required structure
    const students = teamMembers
      .filter((member: any) => member.role === 'student' && member.user)
      .map((member: any) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role, // Include role
        isFrozen: member.user.isFrozen, // Include isFrozen status
        avatarUrl: member.user.image, // Map image to avatarUrl - Note: image doesn't exist, relying on fallback
      }));

    // Deduplicate students based on user ID
    const uniqueStudents = [];
    const seenIds = new Set();
    for (const student of students) {
      if (!seenIds.has(student.id)) {
        uniqueStudents.push(student);
        seenIds.add(student.id);
      }
    }

    return NextResponse.json({ students: uniqueStudents });
  } catch (error) {
    console.error(`Error fetching students for team ${teamId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// Keep DELETE and POST handlers for individual user actions if they exist in separate files (e.g., /api/manage-users/[id]/route.ts)
// Or add them here if this is the intended single route for all user management.