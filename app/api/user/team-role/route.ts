export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

import { getUser } from '@/lib/db/queries';
import { getUserWithTeam } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ teamRole: null, userRole: null }, { status: 200 });
  }
  const userWithTeam = await getUserWithTeam(user.id);
  return NextResponse.json({
    teamRole: userWithTeam?.teamRole ?? null,
    userRole: user.role ?? null,
  });
}
