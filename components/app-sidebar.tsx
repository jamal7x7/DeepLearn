"use client"

import * as React from "react"
import { useTranslation } from "react-i18next";
import {
  Camera,
  BarChart,
  LayoutDashboard,
  Database,
  Pencil,
  FileScan,
  FileText,
  Folder,
  HelpCircle,
  List,
  Play,
  StopCircle,
  Search,
  Settings,
  Users,
  Triangle,
  Activity,
  Bell,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { is } from "drizzle-orm"

export function useUserTeamRole() {
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [teamRole, setTeamRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/user/team-role')
      .then(res => res.json())
      .then(data => {
        setUserRole(data.userRole);
        setTeamRole(data.teamRole);
      });
  }, []);

  return { userRole, teamRole };
}

const buildNavMain = (userRole: string | null, teamRole: string | null, t: (key: string) => string) => [
    {
      title: t("dashboard"),
      url: userRole === 'admin' ? "/dashboard/admin" : "/dashboard/teacher",
      icon: LayoutDashboard,
    },
    ...(userRole === 'admin' ? [
      {
        title: t("adminControls"),
        url: "#",
        icon: BarChart,
        items: [
          {
            title: t("teamActivities"),
            url: "/dashboard/admin/team-activities",
            icon: Activity,
          },
          {
            title: t("announcements"),
            url: "/dashboard/admin/announcements",
            icon: Bell,
          },
          {
            title: t("manageUsers"),
            url: "/dashboard/manage-users",
            icon: Users,
          },
        ]
      }
    ] : []),
    {
      title: t("teacherControl"),
      url: "#",
      icon: FileText,
      // isActive: true,
      items: [
        {
          title: t("overview"),
          url: "/dashboard/teacher-control",
          icon: FileText,
        },
        {
          title: t("startStream"),
          url: "/dashboard/stream-control",
          icon: Play,
        },
        {
          title: t("stopStream"),
          url: "/dashboard/teacher-control/stream/stop",
          icon: StopCircle,
        },
        {
          title: t("streamSettings"),
          url: "/dashboard/teacher-control/stream/settings",
          icon: Settings,
        },
        {
          title: t("editMdxFiles"),
          url: "#",
          icon: Pencil,
        },
      ]
    },
    {
      title: t("studentStream"),
      url: "#",
      icon: List,
    },
    {
      title: t("team"),
      url: "#",
      icon: Users,
      items: [
        ...(userRole === "teacher" || userRole === "owner" || teamRole === "representative"
          ? [{
              title: t("invitationCodes"),
              url: "/dashboard/invitation-codes",
              icon: require("lucide-react").Key,
            }]
          : []),
        {
          title: t("joinTeam"),
          url: "/dashboard/join-team",
          icon: require("lucide-react").UserPlus,
        },
        {
          title: t("teamMembers"),
          url: "/dashboard/team-members",
          icon: require("lucide-react").Users,
        },
      ],
    },
    {
      title: t("manageUsers"),
      url: "/dashboard/manage-users",
      icon: Users,
    },
  ]

export function AppSidebar({ userRole: incomingUserRole, teamRole: incomingTeamRole, ...restProps }: React.ComponentProps<typeof Sidebar> & { userRole?: string, teamRole?: string }) {
  const { userRole: fetchedUserRole, teamRole: fetchedTeamRole } = useUserTeamRole();
  // Prioritize fetched role, fall back to prop, default to null
  const userRole = fetchedUserRole ?? incomingUserRole ?? null;
  const teamRole = fetchedTeamRole ?? incomingTeamRole ?? null;
  const { t } = useTranslation();
  const navMain = React.useMemo(() => buildNavMain(userRole, teamRole, t), [userRole, teamRole, t]);
  return (
    <Sidebar {...restProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Triangle className="!size-5 fill-primary-foreground" />
                <span className="text-base font-semibold">Triangl.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} userRole={userRole ?? undefined} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
