import { SidebarProvider, SidebarTrigger,SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { getSession } from "@/lib/auth/session"
 export default async function Layout({ children }: { children: React.ReactNode }) {
   const session = await getSession();
   const userRole = session?.user?.role ?? "guest"; // Default to 'guest' if no session or role
 
   return (
     <div>
  
     <SidebarProvider
     style={
         {
           "--sidebar-width": "calc(var(--spacing) * 72)",
           "--header-height": "calc(var(--spacing) * 12)",
         } as React.CSSProperties
       } >

      <AppSidebar variant="inset" collapsible="icon" userRole={userRole} />
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