"use client";

import { AnnouncementCardProps } from '@/components/AnnouncementCard';
import { useTranslation } from 'react-i18next';
import { Calendar, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnnouncementMdxPreview from '@/components/AnnouncementMdxPreview';

interface LatestAnnouncementCardProps {
  announcement: AnnouncementCardProps | null;
  isRTL?: boolean;
}

export function LatestAnnouncementCard({ announcement, isRTL }: LatestAnnouncementCardProps) {
  const { t } = useTranslation();

  if (!announcement) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 shadow-sm',
        isRTL ? 'direction-rtl' : 'direction-ltr'
      )}>
        <Bell className="w-10 h-10 text-blue-300 dark:text-blue-400 mb-2" />
        <span className="text-base text-muted-foreground">{t('latestAnnouncement.noAnnouncementsFound', 'No announcements found')}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/60 dark:from-blue-900/40 dark:to-gray-900 border border-blue-200 dark:border-blue-900 shadow-lg flex flex-col gap-2',
      isRTL ? 'direction-rtl' : 'direction-ltr'
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-6 h-6 text-blue-400" />
        <span className="font-semibold text-blue-900 dark:text-blue-200 text-lg truncate">
          {announcement.teamName}
        </span>
      </div>
      <div className="text-base text-gray-800 dark:text-gray-100 mb-2">
        {announcement.type === 'mdx' ? (
          <AnnouncementMdxPreview value={announcement.content || announcement.message || ''} />
        ) : (
          <span className="line-clamp-3">{announcement.content || announcement.message}</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <Calendar className="w-4 h-4" />
        <span>{t('latestAnnouncement.sentAt', { defaultValue: 'Sent at {{date}}', date: new Date(announcement.sentAt).toLocaleDateString() })}</span>
      </div>
      <span className="absolute top-4 right-4 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
        {t('latestAnnouncement.latest', 'Latest Announcement')}
      </span>
    </div>
  );
}

export default LatestAnnouncementCard;
