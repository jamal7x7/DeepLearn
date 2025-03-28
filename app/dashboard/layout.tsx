import { SidebarProvider, SidebarTrigger,SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
 
    <SidebarProvider
    style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
      <AppSidebar variant="inset"  collapsible="icon" />
      <SidebarInset>
      <SiteHeader />
      <main>
        {/* <SidebarTrigger /> */}
        {children}
      </main>
       </SidebarInset>
    </SidebarProvider>
    </div>
  )
}