"use client"

import React, { useState } from "react"
import {
  IconCirclePlusFilled,
  IconMail,
  IconChevronRight,
  IconSettings,
  IconPlayerPlay,
  IconPlayerStop,
  IconAntenna, // Added for Stream Control
} from "@tabler/icons-react"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import QuickCreateModal for code splitting and SSR safety
const QuickCreateModal = dynamic(() => import("./quick-create/quick-create-modal").then(mod => mod.QuickCreateModal), { ssr: false })

export function NavMain({
  items,
  userRole,
}: {
  items: {
    title: string
    url: string
    icon?: React.ComponentType<import("lucide-react").LucideProps>
    items?: {
      title: string
      url: string
      icon?: React.ComponentType<import("lucide-react").LucideProps>
      items?: {
        title: string
        url: string
        icon?: React.ComponentType<import("lucide-react").LucideProps>
      }[]
    }[]
  }[]
  userRole?: string
}) {
  const pathname = usePathname()
  const isActive = (url: string) => pathname === url
  const { state: sidebarState } = useSidebar()
  const isCollapsed = sidebarState === "collapsed"

  // State for expanded submenus (by title)
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  // Modal state
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false)

  // Helper function to get appropriate icon for stream-related items
  const getStreamActionIcon = (title: string, defaultIcon?: React.ComponentType<import("lucide-react").LucideProps>) => {
    if (title.toLowerCase().includes('start stream')) {
      return IconPlayerPlay
    } else if (title.toLowerCase().includes('stop stream')) {
      return IconPlayerStop
    } else if (title.toLowerCase().includes('stream settings')) {
      return IconSettings
    } else if (title.toLowerCase().includes('stream')) {
      return IconAntenna
    }
    return defaultIcon
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary  hover:bg-primary/90 text-foreground hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-300 ease-out group relative bg-gradient-to-r from-primary/20 to-transparent shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
              onClick={() => setQuickCreateOpen(true)}
            >
              <IconCirclePlusFilled className="transition-transform duration-300 ease-out  group-hover:scale-110" />
              <span >Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 hover:bg-primary/10 transition-all duration-300 ease-out"
              variant="outline"
            >
              <IconMail className="transition-transform duration-300 ease-out hover:scale-110" />
              <span className="sr-only">Inbox</span>
            </Button>
            <QuickCreateModal open={isQuickCreateOpen} onOpenChange={setQuickCreateOpen} />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items
            .filter((item) => {
              if (item.title === "Manage Users" && userRole !== "teacher" && userRole !== "admin") {
                return false;
              }
              if (item.title === "Teacher Control" && userRole !== "teacher") {
                return false;
              }
              return true;
            })
            .map((item) => (
            <SidebarMenuItem key={item.title}>
              {/* --- Conditional Rendering based on Sidebar State --- */}
              {item.items && item.items.length > 0 ? (
                isCollapsed ? (
                  // Collapsed: Show submenu in a popup
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={false}
                        className="relative overflow-hidden group/sidebar-accordion"
                      >
                        <div className="flex w-full items-center gap-2 cursor-pointer select-none">
                          {item.icon && (
                            <div className="relative">
                              <item.icon className="h-4 w-4 transition-transform duration-300 ease-out group-hover/sidebar-accordion:scale-110 text-primary/80" />
                            </div>
                          )}
                          <span className="sr-only">{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="p-0 w-52">
                      <ul className="py-2">
                        {item.items.map((subitem) => {
                          const StreamIcon = getStreamActionIcon(subitem.title, subitem.icon);
                          const isStreamItem = subitem.url.includes('stream-control');
                          return (
                            <SidebarMenuItem key={subitem.title}>
                              <SidebarMenuButton
                                asChild
                                tooltip={subitem.title}
                                isActive={isActive(subitem.url)}
                                className={`group/stream-item w-full text-left ${isStreamItem ? 'hover:bg-primary/10 transition-all duration-300 ease-out hover:translate-x-0.5' : ''}`}
                              >
                                <Link href={subitem.url} prefetch className="flex items-center gap-2 px-3 py-2">
                                  {StreamIcon && <StreamIcon className="h-4 w-4 mr-2" />}
                                  <span>{subitem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </ul>
                    </PopoverContent>
                  </Popover>
                ) : (
                  // Expanded: Inline accordion submenu
                  <>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={false}
                      className={`relative overflow-hidden group/sidebar-accordion`}
                    >
                      <div className="flex w-full items-center gap-2 cursor-default select-none">
                        {item.icon && (
                          <div className="relative">
                            <item.icon className="h-4 w-4 transition-transform duration-300 ease-out group-hover/sidebar-accordion:scale-110 text-primary/80" />
                          </div>
                        )}
                        <span className="flex flex-grow items-center text-[0.85rem] font-medium">{item.title}</span>
                        <button
                          type="button"
                          aria-label={`Toggle ${item.title} menu`}
                          className="ml-auto p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 group transition-all duration-300 ease-out hover:shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setExpandedMenus((prev) => ({
                              ...prev,
                              [item.title]: !prev[item.title],
                            }));
                          }}
                        >
                          <IconChevronRight
                            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:text-primary"
                            style={{ transform: expandedMenus[item.title] ? "rotate(90deg)" : "none" }}
                          />
                        </button>
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/sidebar-accordion:opacity-30 transition-opacity duration-300 -z-10"></span>
                      </div>
                    </SidebarMenuButton>
                    {/* Inline Accordion Submenu (expanded state) */}
                    {!isCollapsed && (
                      <ul
                        className={`ml-6 pl-3 border-l-2 border-border/50 transition-all duration-500 ease-in-out overflow-hidden ${
                          expandedMenus[item.title]
                            ? "max-h-96 opacity-100 animate-accordion-down border-l-2 border-primary/50 shadow-[inset_0_0_12px_rgba(0,0,0,0.03)]"
                            : "max-h-0 opacity-0 animate-accordion-up"
                        }`}
                      >
                        {item.items.map((subitem) => {
                          const StreamIcon = getStreamActionIcon(subitem.title, subitem.icon);
                          const isStreamItem = subitem.url.includes('stream-control');
                          return (
                            <SidebarMenuItem key={subitem.title}>
                              <SidebarMenuButton
                                asChild
                                tooltip={subitem.title}
                                isActive={isActive(subitem.url)}
                                className={`group/stream-item ${isStreamItem ? 'hover:bg-primary/10 transition-all duration-300 ease-out hover:translate-x-0.5' : ''}`}
                              >
                                <Link
                                  href={subitem.url}
                                  prefetch
                                  className={`${isStreamItem ? 'relative overflow-hidden rounded-md' : ''}`}
                                >
                                  {StreamIcon && (
                                    <div className="relative">
                                      <StreamIcon className={`mr-2 h-4 w-4 transition-all duration-300 ease-out ${isStreamItem ? 'text-primary' : ''} ${isStreamItem ? 'group-hover/stream-item:scale-125 group-hover/stream-item:rotate-3' : 'group-hover/stream-item:scale-110'}`} />
                                      {isStreamItem && isActive(subitem.url) && (
                                          <span className="absolute -inset-1 rounded-full animate-ping bg-primary/30 opacity-75"></span>
                                      )}
                                    </div>
                                  )}
                                  <span className={`${isStreamItem ? 'font-medium' : ''} ${isStreamItem && isActive(subitem.url) ? 'text-primary' : ''} transition-transform duration-300 ease-out group-hover/stream-item:translate-x-0.5`}>{subitem.title}</span>
                                  {isStreamItem && (
                                    <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/stream-item:opacity-100 transition-all duration-300 ease-out -z-10 rounded-md"></span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )
              ) : (
                // Standard menu item (no submenu)
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive(item.url)}
                  className="relative overflow-hidden group/menu-item"
                >
                  <Link href={item.url} prefetch className="flex w-full items-center gap-2">
                    {item.icon && (
                      <div className="relative">
                        <item.icon className="transition-transform h-4 w-4  duration-300 ease-out group-hover/menu-item:scale-110 z-10" />
                        {isActive(item.url) && (
                          <span className="absolute -inset-1 rounded-full bg-primary/20 blur-sm -z-10"></span>
                        )}
                      </div>
                    )}
                    <span className="flex flex-grow  items-end text-[0.85rem] font-medium transition-all duration-300 ease-out group-hover/menu-item:translate-x-0.5">
                      {item.title}
                    </span>
                    {isActive(item.url) && (
                      <span className="absolute  inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 -z-10"></span>
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
