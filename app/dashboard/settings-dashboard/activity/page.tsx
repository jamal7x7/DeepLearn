import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import HeadingSmall from '@/components/heading-small';
import { useTranslation } from 'react-i18next';

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
};

function getRelativeTime(date: Date, t: (key: string, defaultText?: string) => string) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('activity.justNow', 'just now');
  if (diffInSeconds < 3600)
    return t('activity.minutesAgo', '{{count}} minutes ago', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400)
    return t('activity.hoursAgo', '{{count}} hours ago', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800)
    return t('activity.daysAgo', '{{count}} days ago', { count: Math.floor(diffInSeconds / 86400) });
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType, t: (key: string, defaultText?: string) => string): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return t('activity.signedUp', 'You signed up');
    case ActivityType.SIGN_IN:
      return t('activity.signedIn', 'You signed in');
    case ActivityType.SIGN_OUT:
      return t('activity.signedOut', 'You signed out');
    case ActivityType.UPDATE_PASSWORD:
      return t('activity.updatedPassword', 'You updated your password');
    case ActivityType.DELETE_ACCOUNT:
      return t('activity.deletedAccount', 'You deleted your account');
    case ActivityType.UPDATE_ACCOUNT:
      return t('activity.updatedAccount', 'You updated your account');
    case ActivityType.CREATE_TEAM:
      return t('activity.createdTeam', 'You created a new team');
    case ActivityType.REMOVE_TEAM_MEMBER:
      return t('activity.removedTeamMember', 'You removed a team member');
    case ActivityType.INVITE_TEAM_MEMBER:
      return t('activity.invitedTeamMember', 'You invited a team member');
    case ActivityType.ACCEPT_INVITATION:
      return t('activity.acceptedInvitation', 'You accepted an invitation');
    case ActivityType.GENERATE_INVITATION_CODE:
      return t('activity.generatedInvitationCode', 'You generated an invitation code');
    case ActivityType.JOIN_TEAM_WITH_CODE:
      return t('activity.joinedTeamWithCode', 'You joined a team with an invitation code');
    default:
      return t('activity.unknownAction', 'Unknown action occurred');
  }
}

export default async function ActivityPage() {
  const { t } = useTranslation();
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-0">
      <HeadingSmall title={t('activity.title', 'Activity Log')} description={t('activity.description', 'the following is your Activity Log')}/>
      <Card className="mb-8 mt-6">
        <CardHeader>
          <CardTitle>{t('activity.history', 'Activity History')}</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType,
                  t
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium ">
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp), t)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('activity.noActivity', 'No activity yet')}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {t('activity.noActivityDescription', 'When you perform actions like signing in or updating your account, they\'ll appear here.')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
