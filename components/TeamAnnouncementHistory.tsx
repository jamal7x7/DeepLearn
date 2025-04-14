'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react'; // framer-motion changed to motion/react in new version, so don't change this
import { AnnouncementCard, AnnouncementCardProps } from "@/components/AnnouncementCard";
import { useTranslation } from "react-i18next";

type Announcement = AnnouncementCardProps;

interface TeamAnnouncementHistoryProps {
  teamId: number;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

export default function TeamAnnouncementHistory({ teamId, refreshTrigger = 0 }: TeamAnnouncementHistoryProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { t } = useTranslation();

  const fetchAnnouncements = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }

      const response = await fetch(`/api/team/announcements?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load announcements');
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  // Initial load and refresh when teamId changes
  useEffect(() => {
    fetchAnnouncements();
  }, [teamId, fetchAnnouncements]);
  
  // Refresh when refreshTrigger changes (when a new announcement is sent)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAnnouncements(true);
    }
  }, [refreshTrigger, fetchAnnouncements]);

  // Header with refresh button and last refreshed time
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm text-muted-foreground">
        {lastRefreshed && (
          <span>
            {t("lastUpdated", { time: lastRefreshed.toLocaleTimeString() })}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={loading || refreshing}
        className="h-8 px-2"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? t("refreshing") : t("refresh")}
      </Button>
    </div>
  );

  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <div className="flex justify-center items-center py-10 border rounded-md bg-card/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <div className="text-center text-destructive py-10 border border-destructive/20 rounded-md bg-destructive/5">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md bg-card/50">
          <Bell className="h-12 w-12 mb-4 opacity-20" />
          <p>{t("noAnnouncementsYet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderHeader()}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>
      {refreshing && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          <span className="text-xs text-muted-foreground">{t("updatingAnnouncements")}</span>
        </div>
      )}
    </div>
  );
}