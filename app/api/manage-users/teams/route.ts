import { NextResponse } from 'next/server';
import { updateTeamName } from '@/lib/db/queries';
import { getUser, getTeamsForUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ teams: [] }, { status: 401 });
  }

  // Only return teams where the user is a teacher
  const teams = await getTeamsForUser(user.id, 'teacher');
  return NextResponse.json({ teams });
}

import { createTeamAction } from '@/app/actions/team';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { teamName } = await req.json();
  if (!teamName || typeof teamName !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid team name' }, { status: 400 });
  }
  const result = await createTeamAction(teamName, user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ team: result.team });
}

/**
 * PATCH /api/manage-users/teams
 * Body: { teamId: number, newName: string }
 * Renames a team.
 */
export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { teamId, newName } = await req.json();
  if (
    typeof teamId !== 'number' ||
    !newName ||
    typeof newName !== 'string' ||
    newName.trim().length === 0
  ) {
    return NextResponse.json({ error: 'Missing or invalid teamId or newName' }, { status: 400 });
  }
  try {
    await updateTeamName(teamId, newName.trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update team name' }, { status: 500 });
  }
}