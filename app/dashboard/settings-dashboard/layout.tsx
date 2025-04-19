'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, Shield, Activity, Menu, Cog, CreditCard, Ticket, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import  Heading  from '@/components/heading'; // Adjust the path based on your project structure
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard/settings-dashboard/account', icon: Cog, label: t('settings.account', 'Account') },
    { href: '/dashboard/settings-dashboard', icon: Users, label: t('settings.team', 'Team') },
    { href: '/dashboard/settings-dashboard/invitation-codes', icon: Ticket, label: t('settings.invitationCodes', 'Invitation Codes') },
    { href: '/dashboard/join-team', icon: UserPlus, label: t('settings.joinTeam', 'Join Team') },
    { href: '/dashboard/settings-dashboard/billing', icon: CreditCard, label: t('settings.billing', 'Billing') },
  ];

  return (

    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full px-4 py-6">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between  border-b  p-4">
        <div className="flex items-center">
          <span className="font-medium">{t('settings.title', 'Settings')}</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">{t('settings.toggleSidebar', 'Toggle sidebar')}</span>
        </Button>
      </div>
      <div className="   hidden lg:block lg:px-4 lg:py-0">
        <Heading  title={t('settings.title', 'Settings')} description={t('settings.description', 'Manage your profile and account settings ')} />
      </div>

        
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64      lg:block ${isSidebarOpen ? 'block bg-background' : 'hidden'
            } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant= 'ghost'
                  className={cn('w-full justify-start', {
                    'bg-muted': pathname === item.href,
                })}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:py-4 lg:px-6 ">{children}</main>
      </div>
    </div>
  )
}
