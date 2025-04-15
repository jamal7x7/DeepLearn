'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Calendar, Bell, Activity, RefreshCw, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Team {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

type ActivityData = {
  day: string;
  visits: number;
  teamId?: number;
  teamName?: string;
};

export default function AdminTeamActivities() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [activityData, setActivityData] = useState<{
    daily: ActivityData[];
    weekly: ActivityData[];
    monthly: ActivityData[];
  }>({ daily: [], weekly: [], monthly: [] });
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    activeUsers: 0,
    totalSessions: 0
  });

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/team/all');
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        const teamsData = data.teams || [];
        setTeams(teamsData);
        
        // Calculate stats
        const totalMembers = teamsData.reduce((sum: number, team: Team) => sum + (team.memberCount || 0), 0);
        setStats(prev => ({
          ...prev,
          totalTeams: teamsData.length,
          totalMembers,
          activeUsers: Math.round(totalMembers * 0.75) // Placeholder - would be actual active users
        }));
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  // Fetch activity data for all teams
  const fetchAllTeamsActivity = async () => {
    try {
      setRefreshing(true);
      
      // Create an array of promises for fetching each team's activity
      const activityPromises = teams.map(async (team) => {
        const response = await fetch(`/api/team/activity?teamId=${team.id}`);
        if (!response.ok) throw new Error(`Failed to fetch activity for team ${team.id}`);
        const data = await response.json();
        
        // Add team info to each activity data point
        return {
          daily: data.dailyActivity.map((item: ActivityData) => ({ ...item, teamId: team.id, teamName: team.name })),
          weekly: data.weeklyActivity.map((item: ActivityData) => ({ ...item, teamId: team.id, teamName: team.name })),
          monthly: data.monthlyActivity.map((item: ActivityData) => ({ ...item, teamId: team.id, teamName: team.name }))
        };
      });
      
      // Wait for all promises to resolve
      const allTeamsData = await Promise.all(activityPromises);
      
      // Combine all team data
      const combinedData = {
        daily: allTeamsData.flatMap(data => data.daily),
        weekly: allTeamsData.flatMap(data => data.weekly),
        monthly: allTeamsData.flatMap(data => data.monthly)
      };
      
      setActivityData(combinedData);
      
      // Update total sessions stat
      const totalSessions = combinedData.daily.reduce((sum, day) => sum + day.visits, 0);
      setStats(prev => ({
        ...prev,
        totalSessions
      }));
    } catch (error) {
      console.error('Error fetching all teams activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (teams.length > 0) {
      fetchAllTeamsActivity();
    }
  }, [teams]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllTeamsActivity();
  };

  // Filter activity data by team
  const getFilteredActivityData = () => {
    if (filterTeamId === 'all') {
      return activityData;
    }
    
    const teamIdNum = parseInt(filterTeamId);
    return {
      daily: activityData.daily.filter(item => item.teamId === teamIdNum),
      weekly: activityData.weekly.filter(item => item.teamId === teamIdNum),
      monthly: activityData.monthly.filter(item => item.teamId === teamIdNum)
    };
  };

  const filteredData = getFilteredActivityData();

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('teamActivities')}</h1>
        <div className="flex items-center space-x-4">
          <Select value={filterTeamId} onValueChange={setFilterTeamId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filterByTeam')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTeams')}</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{t('totalTeams')}</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalTeams}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{t('totalMembers')}</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalMembers}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{t('activeUsers')}</span>
              </div>
              <span className="text-2xl font-bold">{stats.activeUsers}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{t('totalSessions')}</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalSessions}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Charts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('activityOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList className="mb-4">
              <TabsTrigger value="daily">{t('daily')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="h-80">
              {filteredData.daily.length > 0 ? (
                <div className="h-full">
                  {/* Placeholder for chart - would use a chart library like recharts */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('dailyActivityChart')}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">{t('noActivityData')}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="weekly" className="h-80">
              {filteredData.weekly.length > 0 ? (
                <div className="h-full">
                  {/* Placeholder for chart */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('weeklyActivityChart')}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">{t('noActivityData')}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="monthly" className="h-80">
              {filteredData.monthly.length > 0 ? (
                <div className="h-full">
                  {/* Placeholder for chart */}
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">{t('monthlyActivityChart')}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">{t('noActivityData')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Team Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('teamActivityBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">{t('teamName')}</th>
                  <th className="text-left py-3 px-4">{t('members')}</th>
                  <th className="text-left py-3 px-4">{t('activeSessions')}</th>
                  <th className="text-left py-3 px-4">{t('lastActive')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => {
                  // Calculate team-specific stats
                  const teamSessions = filteredData.daily
                    .filter(item => item.teamId === team.id)
                    .reduce((sum, day) => sum + day.visits, 0);
                  
                  return (
                    <tr key={team.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{team.name}</td>
                      <td className="py-3 px-4">{team.memberCount}</td>
                      <td className="py-3 px-4">{teamSessions}</td>
                      <td className="py-3 px-4">Today</td> {/* Placeholder - would use actual data */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}