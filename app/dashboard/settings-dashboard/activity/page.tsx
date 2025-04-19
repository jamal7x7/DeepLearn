import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,

  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
  Ticket,
  UserCheck,
  Megaphone,
} from 'lucide-react';
import ActivityClient from './activity-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityType, ActivityLog } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.GENERATE_INVITATION_CODE]: Ticket,
  [ActivityType.JOIN_TEAM_WITH_CODE]: UserCheck,
  [ActivityType.SEND_ANNOUNCEMENT]: Megaphone,
};

// Type for logs shown in dashboard activity page
/**
 * DashboardActivityLog represents the structure returned by getActivityLogs for the dashboard UI.
 */
type DashboardActivityLog = {
  id: number;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
  userName: string | null;
};

export default async function ActivityPage() {
  let logs: DashboardActivityLog[] = [];
  let error: string | null = null;
  try {
    logs = await getActivityLogs();
  } catch (err: any) {
    error = err?.message || 'Unknown error';
  }

  return <ActivityClient logs={logs} error={error} />;
}
