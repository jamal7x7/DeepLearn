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

  // Removed streamControlOpen state
  const [teacherControlOpen, setTeacherControlOpen] = useState(false)
 
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear group relative bg-gradient-to-r from-primary/10 to-transparent"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
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

              {/* EXPANDED STATE or item without submenus */}
              {(!isCollapsed || !item.items || item.items.length === 0 || item.title !== "Teacher Control") && (
                <>
                  {item.title !== "Teacher Control" ? (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item.url)}
                      className="relative"
                    >
                      <Link href={item.url} prefetch className="flex w-full items-center gap-2">
                        {item.icon && <item.icon className="transition-transform duration-200 group-hover:scale-100" />}
                        <span className="flex flex-grow items-center text-[0.85rem] font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={false}
                      className="relative"
                    >
                      <div className="flex w-full items-center gap-2 cursor-default select-none">
                        {item.icon && <item.icon className="transition-transform duration-200 group-hover:scale-100" />}
                        <span className="flex flex-grow items-center text-[0.85rem] font-normal">{item.title}</span>
                        {item.items && item.items.length > 0 && (
                          <button
                            type="button"
                            aria-label="Toggle Teacher Control menu"
                            className="ml-auto p-1 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setTeacherControlOpen(!teacherControlOpen);
                            }}
                          >
                            <IconChevronRight
                              className="h-4 w-4 transition-transform duration-300 ease-in-out group-hover:text-primary"
                              style={{ transform: teacherControlOpen ? "rotate(90deg)" : "none" }}
                            />
                          </button>
                        )}
                      </div>
                    </SidebarMenuButton>
                  )}

                  {/* Inline Accordion Submenu (only for Teacher Control when expanded) */}
                  {!isCollapsed && item.items && item.items.length > 0 && item.title === "Teacher Control" && (
                     <ul
                      className={`ml-6 pl-3 border-l-2 border-border/50 transition-all duration-300 ease-out overflow-hidden ${
                        teacherControlOpen
                          ? "max-h-96 opacity-100 animate-accordion-down border-l-2 border-primary/50"
                          : "max-h-0 opacity-0 animate-accordion-up"
                      }`}
                    >
                      {item.items.map((subitem) => {
                        // Get appropriate icon for stream-related items
                        const StreamIcon = getStreamActionIcon(subitem.title, subitem.icon);
                        const isStreamItem = subitem.url.includes('stream-control');
                        
                        return (
                          <SidebarMenuItem key={subitem.title}>
                            <SidebarMenuButton
                              asChild
                              tooltip={subitem.title}
                              isActive={isActive(subitem.url)}
                              className={`group ${isStreamItem ? 'hover:bg-primary/10 transition-colors duration-200' : ''}`}
                            >
                              <Link
                                href={subitem.url}
                                prefetch
                                className={`${isStreamItem ? 'relative overflow-hidden' : ''}`}
                              >
                                {StreamIcon && (
                                  <div className="relative">
                                    <StreamIcon className={`mr-2 h-4 w-4 transition-transform duration-200 ${isStreamItem ? 'text-primary' : ''} ${isStreamItem ? 'group-hover:scale-110' : 'group-hover:scale-105'}`} />
                                    {isStreamItem && isActive(subitem.url) && (
                                        <span className="absolute -inset-1 rounded-full animate-ping bg-primary/30 opacity-75"></span>
                                    )}
                                  </div>
                                )}
                                <span className={`${isStreamItem ? 'font-medium' : ''} ${isStreamItem && isActive(subitem.url) ? 'text-primary' : ''}`}>{subitem.title}</span>
                                {isStreamItem && (
                                  <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </ul>
                  )}
                   {/* Render standard submenus for items other than Teacher Control (if applicable) */}
                   {!isCollapsed && item.items && item.items.length > 0 && item.title !== "Teacher Control" && (
                     <div className="ml-6 pl-3 border-l-2 border-border/50">
                       {item.items.map((subitem) => {
                         // Get appropriate icon for stream-related items
                         const StreamIcon = getStreamActionIcon(subitem.title, subitem.icon);
                         const isStreamItem = subitem.url.includes('stream-control');
                         
                         return (
                           <SidebarMenuItem key={subitem.title}>
                             <SidebarMenuButton
                               asChild
                               tooltip={subitem.title}
                               isActive={isActive(subitem.url)}
                               className={`group ${isStreamItem ? 'hover:bg-primary/10 transition-colors duration-200' : ''}`}
                             >
                               <Link 
                                 href={subitem.url} 
                                 prefetch 
                                 className={`${isStreamItem ? 'relative overflow-hidden' : ''}`}
                               >
                                 {StreamIcon && <StreamIcon className={`transition-transform duration-200 ${isStreamItem ? 'text-primary group-hover:scale-110' : 'group-hover:scale-105'}`} />}
                                 <span className={`${isStreamItem ? 'font-medium' : ''}`}>{subitem.title}</span>
                                 {isStreamItem && (
                                   <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                                 )}
                               </Link>
                             </SidebarMenuButton>
                           </SidebarMenuItem>
                         );
                       })}
                     </div>
                   )}
                </>
              )}

              {/* COLLAPSED STATE (only for Teacher Control with items) */}
              {isCollapsed && item.items && item.items.length > 0 && item.title === "Teacher Control" && (
                <Popover>
                  <PopoverTrigger asChild>
                    {/* Button only contains icon when collapsed */}
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={false} // Header is never active
                      className="relative"
                    >
                       {item.icon && <item.icon />}
                       {/* Title span is automatically handled/hidden by SidebarMenuButton styles */}
                       <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="ml-1 w-auto p-1">
                    {/* Render sub-items inside Popover */}
                    <div className="flex flex-col gap-1">
                       {item.items.map((subitem) => {
                         // Get appropriate icon for stream-related items in popover
                         const StreamIcon = getStreamActionIcon(subitem.title, subitem.icon);
                         const isStreamItem = subitem.url.includes('stream-control');
                         
                         return (
                           <SidebarMenuButton
                             key={subitem.title}
                             asChild
                             tooltip={subitem.title}
                             isActive={isActive(subitem.url)}
                             className={`w-full justify-start ${isStreamItem ? 'hover:bg-primary/10 transition-colors duration-200' : ''}`}
                             size="sm"
                           >
                             <Link href={subitem.url} prefetch className={`${isStreamItem ? 'relative overflow-hidden' : ''}`}>
                               {StreamIcon && (
                                 <div className="relative">
                                   <StreamIcon className={`mr-2 h-4 w-4 transition-transform duration-200 ${isStreamItem ? 'text-primary' : ''} ${isStreamItem ? 'group-hover:scale-110' : 'group-hover:scale-105'}`} />
                                   {isStreamItem && isActive(subitem.url) && (
                                     <span className="absolute -inset-1 rounded-full animate-ping bg-primary/30 opacity-75"></span>
                                   )}
                                 </div>
                               )}
                               <span className={`${isStreamItem ? 'font-medium' : ''} ${isStreamItem && isActive(subitem.url) ? 'text-primary' : ''}`}>{subitem.title}</span>
                               {isStreamItem && (
                                 <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                               )}
                             </Link>
                           </SidebarMenuButton>
                         );
                       })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
