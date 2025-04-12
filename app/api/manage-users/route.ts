import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ students: [] }, { status: 401 });
  }

  const team = await getTeamForUser(user.id);
  if (!team || !team.teamMembers) {
    return NextResponse.json({ students: [] });
  }

  // Filter team members for students
  const students = team.teamMembers
    .filter((member: any) => member.role === 'student' && member.user)
    .map((member: any) => member.user);

  return NextResponse.json({ students });
}