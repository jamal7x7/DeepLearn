"use client";

import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import HeadingSmall from "@/components/heading-small";
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
  Megaphone,
} from "lucide-react";
import { ActivityType } from "@/lib/db/schema";
import React from "react";

// Type for logs shown in dashboard activity page
export type DashboardActivityLog = {
  id: number;
  action: string;
  timestamp: string | Date;
  ipAddress: string | null;
  userName: string | null;
};

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

function getRelativeTime(date: Date, t: (key: string, options?: any) => string) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return t("activity.justNow", { defaultValue: "just now" });
  if (diffInSeconds < 3600)
    return t("activity.minutesAgo", { defaultValue: "{{count}} minutes ago", count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400)
    return t("activity.hoursAgo", { defaultValue: "{{count}} hours ago", count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800)
    return t("activity.daysAgo", { defaultValue: "{{count}} days ago", count: Math.floor(diffInSeconds / 86400) });
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType, t: (key: string, options?: any) => string): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return t("activity.signedUp", { defaultValue: "You signed up" });
    case ActivityType.SIGN_IN:
      return t("activity.signedIn", { defaultValue: "You signed in" });
    case ActivityType.SIGN_OUT:
      return t("activity.signedOut", { defaultValue: "You signed out" });
    case ActivityType.UPDATE_PASSWORD:
      return t("activity.updatedPassword", { defaultValue: "You updated your password" });
    case ActivityType.DELETE_ACCOUNT:
      return t("activity.deletedAccount", { defaultValue: "You deleted your account" });
    case ActivityType.UPDATE_ACCOUNT:
      return t("activity.updatedAccount", { defaultValue: "You updated your account" });
    case ActivityType.CREATE_TEAM:
      return t("activity.createdTeam", { defaultValue: "You created a new team" });
    case ActivityType.REMOVE_TEAM_MEMBER:
      return t("activity.removedTeamMember", { defaultValue: "You removed a team member" });
    case ActivityType.INVITE_TEAM_MEMBER:
      return t("activity.invitedTeamMember", { defaultValue: "You invited a team member" });
    case ActivityType.ACCEPT_INVITATION:
      return t("activity.acceptedInvitation", { defaultValue: "You accepted an invitation" });
    case ActivityType.GENERATE_INVITATION_CODE:
      return t("activity.generatedInvitationCode", { defaultValue: "You generated an invitation code" });
    case ActivityType.JOIN_TEAM_WITH_CODE:
      return t("activity.joinedTeamWithCode", { defaultValue: "You joined a team with an invitation code" });
    default:
      return t("activity.unknownAction", { defaultValue: "Unknown action occurred" });
  }
}

interface ActivityClientProps {
  logs: DashboardActivityLog[];
  error: string | null;
}

const ActivityClient: React.FC<ActivityClientProps> = ({ logs, error }) => {
  const { t } = useTranslation();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-0">
      <HeadingSmall>
        {t("activity.title", { defaultValue: "Recent Activity" })}
      </HeadingSmall>
      {logs.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("activity.noActivity", { defaultValue: "No activity yet" })}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {t("activity.noActivityDescription", {
                defaultValue:
                  "When you perform actions like signing in or updating your account, they'll appear here.",
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {logs.map((log) => {
            const Icon = iconMap[log.action as ActivityType] || AlertCircle;
            return (
              <Card key={log.id} className="flex items-center p-4">
                <Icon className="h-6 w-6 text-gray-500 mr-4" />
                <div className="flex-1">
                  <div className="font-medium">
                    {formatAction(log.action as ActivityType, t)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getRelativeTime(new Date(log.timestamp), t)}
                    {log.userName && (
                      <>
                        {" • "}
                        {log.userName}
                      </>
                    )}
                  </div>
                </div>
                {log.ipAddress && (
                  <div className="text-xs text-gray-300 ml-4">
                    {log.ipAddress}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ActivityClient;
