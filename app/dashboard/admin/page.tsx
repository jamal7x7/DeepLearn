'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, Bell, Activity, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Button } from '@/components/ui/button';
import AdminTeamActivityWidget from '@/components/AdminTeamActivityWidget';
import AdminAnnouncementsDashboard from '@/components/AdminAnnouncementsDashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components

interface Team {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    totalAnnouncements: 0, // Placeholder
    activeUsers: 0 // Placeholder
  });

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/team/all');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const teamsData = data.teams || [];
        setTeams(teamsData);
        
        // Calculate stats
        const totalMembers = teamsData.reduce((sum: number, team: Team) => sum + (team.memberCount || 0), 0);
        setStats({
          totalTeams: teamsData.length,
          totalMembers,
          totalAnnouncements: 0, // This would be updated with actual data
          activeUsers: Math.round(totalMembers * 0.75) // Placeholder - would be actual active users
        });
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError(t('errorFetchingData', 'Failed to load dashboard data. Please try again later.')); // Set error state
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    // Enhanced Loading State with Skeletons
    return (
      <div className="container mx-auto space-y-8 py-6">
         <Skeleton className="h-8 w-48" /> {/* Title Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Skeleton for Main Content Sections (2/3 + 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <Card className="lg:col-span-2"> {/* Skeleton for Announcements (2/3 width) */}
             <CardHeader>
               <Skeleton className="h-6 w-1/3 mb-2" />
               <Skeleton className="h-4 w-2/3" />
             </CardHeader>
             <CardContent>
               <Skeleton className="h-40 w-full" />
             </CardContent>
           </Card>
           <Card> {/* Skeleton for Team Activity (1/3 width) */}
             <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
               <Skeleton className="h-4 w-2/3" />
             </CardHeader>
             <CardContent>
               <Skeleton className="h-40 w-full" />
             </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errorTitle', 'Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main Dashboard Content
  return (
    <div className="container mx-auto py-6 space-y-6"> {/* Added padding and spacing */}
      <h1 className="text-3xl font-bold tracking-tight">{t('adminDashboardTitle', 'Admin Dashboard')}</h1> {/* Added Page Title */}
      {/* Platform Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> {/* Adjusted grid and spacing */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalTeams')}</p>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" /> {/* Increased icon size */}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalMembers')}</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" /> {/* Increased icon size */}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('activeUsers')}</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Activity className="h-6 w-6 text-muted-foreground" /> {/* Increased icon size */}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('announcements')}</p>
                <p className="text-2xl font-bold">{stats.totalAnnouncements}</p>
              </div>
              <Bell className="h-6 w-6 text-muted-foreground" /> {/* Increased icon size */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"> {/* Changed to 3 columns for 2/3 + 1/3 layout */}
        {/* Announcements */}
        <Card className="lg:col-span-2"> {/* Announcements take 2/3 width */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div> {/* Wrap title and description */}
              <CardTitle>{t('announcements')}</CardTitle>
              <CardDescription>{t('announcementsDescription', 'Manage and view platform announcements.')}</CardDescription> {/* Added description */}
            </div>
            <Button size="sm" className="gap-1">
              <Bell className="h-4 w-4" />
              {t('createAnnouncement')}
            </Button>
          </CardHeader>
          <CardContent>
            <AdminAnnouncementsDashboard teams={teams} />
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('teamActivity')}</CardTitle>
            <CardDescription>{t('teamActivityDescription', 'Overview of recent team activities.')}</CardDescription> {/* Added description */}
          </CardHeader>
          <CardContent>
            <AdminTeamActivityWidget teams={teams} />
          </CardContent>
        </Card>
      </div>

      {/* Removed the separate button div */}
    </div>
  );
}