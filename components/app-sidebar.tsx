"use client"

import * as React from "react"
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Teacher Control",
      url: "#",
      icon: FileText,
      // isActive: true,
      items: [
        {
          title: "Over View",
          url: "/dashboard/teacher-control",
          icon: FileText,
        },
        {
          title: "Start Stream",
          url: "/dashboard/stream-control",
          icon: Play,
        },
        {
          title: "Stop Stream",
          url: "/dashboard/teacher-control/stream/stop",
          icon: StopCircle,
        },
        {
          title: "Stream Settings",
          url: "/dashboard/teacher-control/stream/settings",
          icon: Settings,
        },
        {
          title: "Edit Mdx Files",
          url: "#",
          icon: Pencil,
        },
      ]
    },
    {
      title: "Student Stream",
      url: "#",
      icon: List,
    },
    // {
    //   title: "Lifecycle",
    //   url: "#",
    //   icon: List,
    // },
    // {
    //   title: "Analytics",
    //   url: "#",
    //   icon: BarChart,
    // },
    {
      title: "Projects",
      url: "#",
      icon: Folder,
    },
    {
      title: "Team",
      url: "#",
      icon: Users,
    },
    {
      title: "Manage Users",
      url: "/dashboard/manage-users",
      icon: Users,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: Camera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileText,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileScan,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings-dashboard",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "/dashboard",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: BarChart,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileText,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: string;
}

export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  return (
    <Sidebar  {...props}>
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
        <NavMain items={data.navMain} userRole={userRole} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
