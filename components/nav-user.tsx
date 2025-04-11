"use client"


import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import {  signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { use, useState, Suspense } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';

import Jdenticon from 'react-jdenticon';




export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter();
 const { userPromise } = useUser();
  const user = use(userPromise);
  

    async function handleSignOut() {
      await signOut();
      router.refresh();
      router.push('/');
    }

      const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
        return user.name || user.email || 'Unknown User';
      };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar  className="h-8 w-8 rounded-lg  ">
                {/* <AvatarImage src={user?.avatar} alt={ user?.name ?? ''} /> */}
                <AvatarFallback className="rounded-lg">
                <Jdenticon
                  size={32}
                  value={user?.id || user?.email || user?.name || "user"}
                  title={user ? `Avatar for ${getUserDisplayName(user)}` : "User avatar"}
                  style={{ borderRadius: "9999px", width: "100%", height: "100%" }}
                />
                      {/* {getUserDisplayName(user)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')} */}
                    </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* <AvatarImage  src={user?.avatar} alt={user?.name ?? ''} /> */}
                  <AvatarFallback className="rounded-lg">
                  <Jdenticon
                    size={32}
                    value={user?.id || user?.email || user?.name || "user"}
                    title={user ? `Avatar for ${getUserDisplayName(user)}` : "User avatar"}
                    style={{ borderRadius: "9999px", width: "100%", height: "100%" }}
                  />
                      {/* {getUserDisplayName(user)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')} */}
                    </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name || user?.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              {/* <LogOut className="mr-2 h-4 w-4" /> */}
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
