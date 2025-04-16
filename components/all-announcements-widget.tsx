"use client";

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { AnnouncementCard, AnnouncementCardProps } from '@/components/AnnouncementCard';
import AnnouncementMdxPreview from '@/components/AnnouncementMdxPreview';
import { User, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

interface AllAnnouncementsWidgetProps {
  myAnnouncements: AnnouncementCardProps[];
  adminAnnouncements: AnnouncementCardProps[];
  otherTeacherAnnouncements: AnnouncementCardProps[];
  isRTL?: boolean;
}

export default function AllAnnouncementsWidget({
  myAnnouncements,
  adminAnnouncements,
  otherTeacherAnnouncements,
  isRTL,
}: AllAnnouncementsWidgetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'my' | 'admin' | 'other'>('my');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  // Gather all teams for filter dropdown
  const allTeams = Array.from(new Set([
    ...myAnnouncements,
    ...adminAnnouncements,
    ...otherTeacherAnnouncements,
  ].map(a => a.teamName))).filter(Boolean);

  const tabs: { value: 'my' | 'admin' | 'other'; label: string; icon: React.ElementType }[] = [
    { value: 'my', label: t('myAnnouncements', 'My Announcements'), icon: User },
    { value: 'admin', label: t('adminAnnouncements', 'Admin'), icon: Shield },
    { value: 'other', label: t('otherTeachersAnnouncements', 'Other Teachers'), icon: Users },
  ];

  const announcementsByTab: Record<'my' | 'admin' | 'other', AnnouncementCardProps[]> = {
    my: myAnnouncements,
    admin: adminAnnouncements,
    other: otherTeacherAnnouncements,
  };

  // Filtering logic
  const filtered = announcementsByTab[tab]
    .filter(a =>
      (!search || (a.content || a.message || '').toLowerCase().includes(search.toLowerCase())) &&
      (teamFilter === 'all' || a.teamName === teamFilter)
    );

  return (
    <section
      className={cn(
        'w-full bg-card/90 dark:bg-card/80 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-0 mt-6',
        isRTL ? 'direction-rtl' : 'direction-ltr'
      )}
      aria-label={t('allAnnouncements', 'All Announcements')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('announcements', 'Announcements')}</h2>
        </div>
        {/* Optionally, show badge for new/unread announcements here */}
      </div>
      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as 'my' | 'admin' | 'other')} className="w-full ">
        <div className="relative w-full overflow-x-hidden px-6 sm:px-6">
          <TabsList
            className={cn(
              'flex',
              'w-full',
              'max-w-full',
              'mx-0',
              'bg-muted/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-1 mt-2 mb-4 gap-1',
              isRTL ? 'justify-end' : 'justify-start',
              'min-w-0',
              'sm:w-fit',
              'sm:max-w-full',
              'overflow-x-auto',
              'scrollbar-hide',
            )}
            style={{ minWidth: 0, boxSizing: 'border-box', maxWidth: '100%' }}
          >
            {tabs.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  'flex-1 min-w-0 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  'sm:px-6', // more padding on desktop
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                  isRTL && 'text-right'
                )}
              >
                <span className="block truncate" title={label}>
                  {label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-2 px-4 md:px-6 pt-2 pb-2 bg-transparent">
          <Input
            type="search"
            placeholder={t('searchAnnouncements', 'Search announcements...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            // className="w-full md:w-1/2 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition"
          />
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger
              className="w-full sm:w-40 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition"
            >
              {teamFilter === 'all' ? t('allTeams', 'All Teams') : teamFilter}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTeams', 'All Teams')}</SelectItem>
              {allTeams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Tab Content */}
        {tabs.map(({ value }) => (
          <TabsContent key={value} value={value} className="p-2 md:p-4 animate-fade-in">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <span className="text-4xl mb-2">🗒️</span>
                <span className="font-medium text-base">{t('noAnnouncementsFound', 'No announcements found')}</span>
                <span className="text-xs text-gray-400 mt-2">{t('tryAnotherTeam', 'Try another team or adjust your search.')}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((announcement: AnnouncementCardProps) => (
                  <div key={announcement.id} className="transition-transform duration-150 hover:scale-[1.015]">
                    <AnnouncementCard announcement={announcement} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
