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
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-300 ease-out group relative bg-gradient-to-r from-primary/20 to-transparent shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <IconCirclePlusFilled className="transition-transform duration-300 ease-out group-hover:rotate-[15deg] group-hover:scale-110" />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 hover:bg-primary/10 transition-all duration-300 ease-out"
              variant="outline"
            >
              <IconMail className="transition-transform duration-300 ease-out hover:scale-110" />
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
              if (item.title === "Teacher Control" && userRole !== "dev") {
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
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={false}
                      className="relative overflow-hidden group/teacher-control"
                    >
                      <div className="flex w-full items-center gap-2 cursor-default select-none">
                        {item.icon && (
                          <div className="relative">
                            <item.icon className="transition-transform  duration-300 ease-out group-hover/teacher-control:scale-110 text-primary/80" />
                            <span className="absolute -inset-1 rounded-full bg-primary/10 blur-sm -z-10 opacity-0 group-hover/teacher-control:opacity-100 transition-opacity duration-300"></span>
                          </div>
                        )}
                        <span className="flex flex-grow items-center text-[0.85rem] font-medium">{item.title}</span>
                        {item.items && item.items.length > 0 && (
                          <button
                            type="button"
                            aria-label="Toggle Teacher Control menu"
                            className="ml-auto p-1.5 rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 group transition-all duration-300 ease-out hover:shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setTeacherControlOpen(!teacherControlOpen);
                            }}
                          >
                            <IconChevronRight
                              className="h-4 w-4 transition-transform duration-300 ease-out group-hover:text-primary"
                              style={{ transform: teacherControlOpen ? "rotate(90deg)" : "none" }}
                            />
                          </button>
                        )}
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/teacher-control:opacity-30 transition-opacity duration-300 -z-10"></span>
                      </div>
                    </SidebarMenuButton>
                  )}

                  {/* Inline Accordion Submenu (only for Teacher Control when expanded) */}
                  {!isCollapsed && item.items && item.items.length > 0 && item.title === "Teacher Control" && (
                     <ul
                      className={`ml-6 pl-3 border-l-2 border-border/50 transition-all duration-500 ease-in-out overflow-hidden ${
                        teacherControlOpen
                          ? "max-h-96 opacity-100 animate-accordion-down border-l-2 border-primary/50 shadow-[inset_0_0_12px_rgba(0,0,0,0.03)]"
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
                   {/* Render standard submenus for items other than Teacher Control (if applicable) */}
                   {!isCollapsed && item.items && item.items.length > 0 && item.title !== "Teacher Control" && (
                     <div className="ml-6 pl-3 border-l-2 border-border/50 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-left-1">
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
                               className={`group/submenu ${isStreamItem ? 'hover:bg-primary/10 transition-all duration-300 ease-out hover:translate-x-0.5' : ''}`}
                             >
                               <Link 
                                 href={subitem.url} 
                                 prefetch 
                                 className={`${isStreamItem ? 'relative overflow-hidden rounded-md' : ''}`}
                               >
                                 {StreamIcon && (
                                   <div className="relative">
                                     <StreamIcon className={`mr-2 transition-all duration-300 ease-out ${isStreamItem ? 'text-primary group-hover/submenu:scale-125 group-hover/submenu:rotate-3' : 'group-hover/submenu:scale-110'}`} />
                                     {isStreamItem && isActive(subitem.url) && (
                                       <span className="absolute -inset-1 rounded-full animate-ping bg-primary/30 opacity-75"></span>
                                     )}
                                   </div>
                                 )}
                                 <span className={`${isStreamItem ? 'font-medium' : ''} ${isStreamItem && isActive(subitem.url) ? 'text-primary' : ''} transition-transform duration-300 ease-out group-hover/submenu:translate-x-0.5`}>{subitem.title}</span>
                                 {isStreamItem && (
                                   <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/submenu:opacity-100 transition-all duration-300 ease-out -z-10 rounded-md"></span>
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
                  <PopoverContent side="right" align="start" className="ml-1 w-auto p-1.5 shadow-lg border-primary/10 animate-in fade-in-50 zoom-in-95 duration-300">
                    {/* Render sub-items inside Popover */}
                    <div className="flex flex-col gap-1.5">
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
                             className={`w-full justify-start group/popover-item ${isStreamItem ? 'hover:bg-primary/10 transition-all duration-300 ease-out hover:translate-x-0.5 rounded-md' : ''}`}
                             size="sm"
                           >
                             <Link href={subitem.url} prefetch className={`${isStreamItem ? 'relative overflow-hidden rounded-md' : ''}`}>
                               {StreamIcon && (
                                 <div className="relative">
                                   <StreamIcon className={`mr-2 h-4 w-4 transition-all duration-300 ease-out ${isStreamItem ? 'text-primary' : ''} ${isStreamItem ? 'group-hover/popover-item:scale-125 group-hover/popover-item:rotate-3' : 'group-hover/popover-item:scale-110'}`} />
                                   {isStreamItem && isActive(subitem.url) && (
                                     <span className="absolute -inset-1 rounded-full animate-ping bg-primary/30 opacity-75"></span>
                                   )}
                                 </div>
                               )}
                               <span className={`${isStreamItem ? 'font-medium' : ''} ${isStreamItem && isActive(subitem.url) ? 'text-primary' : ''} transition-transform duration-300 ease-out group-hover/popover-item:translate-x-0.5`}>{subitem.title}</span>
                               {isStreamItem && (
                                 <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/popover-item:opacity-100 transition-all duration-300 ease-out -z-10 rounded-md"></span>
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
