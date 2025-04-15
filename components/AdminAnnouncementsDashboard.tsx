'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Bell, RefreshCw, Filter, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card for internal use if needed, but remove outer one
import { AnnouncementCard, AnnouncementCardProps } from "@/components/AnnouncementCard";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Announcement = AnnouncementCardProps & {
  teamId: number;
};

interface Team {
  id: number;
  name: string;
}

interface AdminAnnouncementsDashboardProps {
  teams: Team[];
}

export default function AdminAnnouncementsDashboard({ teams }: AdminAnnouncementsDashboardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const { t } = useTranslation();

  const fetchAllAnnouncements = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }

      // Create an array of promises for fetching each team's announcements
      const announcementPromises = teams.map(async (team) => {
        const response = await fetch(`/api/team/announcements?teamId=${team.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch announcements for team ${team.id}`);
        }
        const data = await response.json();
        return (data.announcements || []).map((announcement: AnnouncementCardProps) => ({
          ...announcement,
          teamId: team.id
        }));
      });

      // Wait for all promises to resolve
      const allTeamsAnnouncements = await Promise.all(announcementPromises);
      
      // Combine all team announcements and sort by date (newest first)
      const combinedAnnouncements = allTeamsAnnouncements
        .flat()
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

      setAnnouncements(combinedAnnouncements);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError(t('errorFetchingAnnouncements', 'Failed to load announcements. Please try refreshing.'));
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teams]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllAnnouncements(true);
  };

  // Initial load
  useEffect(() => {
    if (teams.length > 0) {
      fetchAllAnnouncements();
    }
  }, [teams, fetchAllAnnouncements]);

  // Filter announcements by team
  const filteredAnnouncements = filterTeamId === 'all'
    ? announcements
    : announcements.filter(announcement => announcement.teamId === parseInt(filterTeamId));

  // Header with refresh button and last refreshed time
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-muted-foreground">
          {lastRefreshed && (
            <span>
              {t("lastUpdated", { time: lastRefreshed.toLocaleTimeString() })}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <Select
            value={filterTeamId}
            onValueChange={setFilterTeamId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterByTeam')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTeams')}</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={loading || refreshing}
        className="h-8 px-2"
        aria-label={refreshing ? t("refreshing") : t("refresh")} // Add aria-label for accessibility
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {/* Remove mr-1 */}
        {/* Text removed */}
      </Button>
    </div>
  );

  if (loading && !refreshing) {
    return (
      // Loading state without outer card
      <div className="space-y-4">
        {renderHeader()}
        <div className="flex justify-center items-center py-10 border rounded-md bg-card/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      </div>
    );
  }

  return (
    // Main content without outer card
    <div className="space-y-4">
        {renderHeader()}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('errorTitle', 'Error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-card/50">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('noAnnouncementsFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={`${announcement.teamId}-${announcement.id}`} // Use composite key
                announcement={announcement}
                canEdit={false}
              />
            ))}
          </div>
        )}
    </div>
  );
}
