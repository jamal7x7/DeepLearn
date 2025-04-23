'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Calendar, Bell, Activity, RefreshCw, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

const TEAM_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e42', // orange
  '#e11d48', // rose
  '#06b6d4', // cyan
  '#f43f5e', // pink
  '#84cc16', // lime
  '#fbbf24', // amber
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f472b6', // fuchsia
  '#facc15', // yellow
];

function groupDataPerTeam(data: ActivityData[]) {
  const teams: Record<string, { name: string; color: string; data: { day: string; visits: number }[] }> = {};
  let colorIdx = 0;
  for (const item of data) {
    if (!item.teamId || !item.teamName) continue;
    const key = item.teamId.toString();
    if (!teams[key]) {
      teams[key] = {
        name: item.teamName,
        color: TEAM_COLORS[colorIdx % TEAM_COLORS.length],
        data: [],
      };
      colorIdx++;
    }
    teams[key].data.push({ day: item.day ?? '', visits: typeof item.visits === 'number' && !isNaN(item.visits) ? item.visits : 0 });
  }
  return teams;
}

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
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
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
          daily: data.dailyActivity.map((item: { key: string; count: number }) => ({
            day: item.key ?? '',
            visits: typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0,
            teamId: team.id,
            teamName: team.name
          })),
          weekly: data.weeklyActivity.map((item: { key: string; count: number }) => ({
            day: item.key ?? '',
            visits: typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0,
            teamId: team.id,
            teamName: team.name
          })),
          monthly: data.monthlyActivity.map((item: { key: string; count: number }) => ({
            day: item.key ?? '',
            visits: typeof item.count === 'number' && !isNaN(item.count) ? item.count : 0,
            teamId: team.id,
            teamName: team.name
          }))
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
      
      // Log the mapped activity data for debugging
      console.log('Mapped activity data:', combinedData);
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

  // CSV Export Utility
  function exportChartDataToCSV() {
    const tabData = filteredData[activeTab];
    if (!tabData || tabData.length === 0) return;
    const header = ['"Date"', '"Visits"', '"Team Name"', '"Team ID"'];
    const rows = tabData.map(item => [
      `"${item.day ?? ''}"`,
      typeof item.visits === 'number' && !isNaN(item.visits) ? item.visits : 0,
      `"${item.teamName ?? ''}"`,
      item.teamId ?? ''
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}-team-activity.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
          {/* Export to CSV Button */}
          <Button variant="outline" size="icon" onClick={exportChartDataToCSV} title={t('exportCSV')}>
            <Download className="h-4 w-4" />
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
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={v => setActiveTab(v as 'daily' | 'weekly' | 'monthly')}>
            <div className="flex justify-between items-center mb-4">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">{t('daily')}</TabsTrigger>
                <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
                <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
              </TabsList>
              <ToggleGroup type="single" value={chartType} onValueChange={v => setChartType((v as 'area' | 'line' | 'bar') || 'area')} className="ml-4">
                <ToggleGroupItem value="area" aria-label={t('areaChart')}>
                  <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="2,14 6,8 10,12 14,2 14,14 2,14" fill="currentColor"/></svg>
                </ToggleGroupItem>
                <ToggleGroupItem value="line" aria-label={t('lineChart')}>
                  <svg width="16" height="16" viewBox="0 0 16 16"><polyline points="2,14 6,8 10,12 14,2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                </ToggleGroupItem>
                <ToggleGroupItem value="bar" aria-label={t('barChart')}>
                  <svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="8" width="2" height="6" fill="currentColor"/><rect x="6" y="4" width="2" height="10" fill="currentColor"/><rect x="10" y="10" width="2" height="4" fill="currentColor"/><rect x="14" y="2" width="2" height="12" fill="currentColor"/></svg>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <TabsContent value="daily" className="h-80">
              {filteredData.daily.length > 0 ? (
                <div className="h-full">
                  {(() => {
                    const teams = groupDataPerTeam(filteredData.daily);
                    const allDays = Array.from(new Set(filteredData.daily.map(item => item.day ?? ''))).sort();
                    const chartData = allDays.map(day => {
                      const entry: Record<string, any> = { day };
                      for (const teamId in teams) {
                        const found = teams[teamId].data.find(d => d.day === day);
                        entry[teamId] = found ? found.visits : 0;
                      }
                      return entry;
                    });
                    const chartProps = { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 } };
                    let chartElement: React.ReactElement = <div />;
                    if (chartType === 'area') {
                      chartElement = (
                        <AreaChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Area
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              fill={team.color}
                              fillOpacity={0.15}
                              isAnimationActive
                            />
                          ))}
                        </AreaChart>
                      );
                    } else if (chartType === 'line') {
                      chartElement = (
                        <LineChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Line
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive
                            />
                          ))}
                        </LineChart>
                      );
                    } else if (chartType === 'bar') {
                      chartElement = (
                        <BarChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Bar
                              key={teamId}
                              dataKey={teamId}
                              name={team.name}
                              fill={team.color}
                              isAnimationActive
                            />
                          ))}
                        </BarChart>
                      );
                    }
                    return (
                      <ChartContainer config={{}}>
                        <ResponsiveContainer width="100%" height={280}>
                          {chartElement}
                        </ResponsiveContainer>
                      </ChartContainer>
                    );
                  })()}
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
                  {(() => {
                    const teams = groupDataPerTeam(filteredData.weekly);
                    const allDays = Array.from(new Set(filteredData.weekly.map(item => item.day ?? ''))).sort();
                    const chartData = allDays.map(day => {
                      const entry: Record<string, any> = { day };
                      for (const teamId in teams) {
                        const found = teams[teamId].data.find(d => d.day === day);
                        entry[teamId] = found ? found.visits : 0;
                      }
                      return entry;
                    });
                    const chartProps = { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 } };
                    let chartElement: React.ReactElement = <div />;
                    if (chartType === 'area') {
                      chartElement = (
                        <AreaChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Area
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              fill={team.color}
                              fillOpacity={0.15}
                              isAnimationActive
                            />
                          ))}
                        </AreaChart>
                      );
                    } else if (chartType === 'line') {
                      chartElement = (
                        <LineChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Line
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive
                            />
                          ))}
                        </LineChart>
                      );
                    } else if (chartType === 'bar') {
                      chartElement = (
                        <BarChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Bar
                              key={teamId}
                              dataKey={teamId}
                              name={team.name}
                              fill={team.color}
                              isAnimationActive
                            />
                          ))}
                        </BarChart>
                      );
                    }
                    return (
                      <ChartContainer config={{}}>
                        <ResponsiveContainer width="100%" height={280}>
                          {chartElement}
                        </ResponsiveContainer>
                      </ChartContainer>
                    );
                  })()}
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
                  {(() => {
                    const teams = groupDataPerTeam(filteredData.monthly);
                    const allDays = Array.from(new Set(filteredData.monthly.map(item => item.day ?? ''))).sort();
                    const chartData = allDays.map(day => {
                      const entry: Record<string, any> = { day };
                      for (const teamId in teams) {
                        const found = teams[teamId].data.find(d => d.day === day);
                        entry[teamId] = found ? found.visits : 0;
                      }
                      return entry;
                    });
                    const chartProps = { data: chartData, margin: { top: 10, right: 30, left: 0, bottom: 0 } };
                    let chartElement: React.ReactElement = <div />;
                    if (chartType === 'area') {
                      chartElement = (
                        <AreaChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Area
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              fill={team.color}
                              fillOpacity={0.15}
                              isAnimationActive
                            />
                          ))}
                        </AreaChart>
                      );
                    } else if (chartType === 'line') {
                      chartElement = (
                        <LineChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Line
                              key={teamId}
                              type="monotone"
                              dataKey={teamId}
                              name={team.name}
                              stroke={team.color}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive
                            />
                          ))}
                        </LineChart>
                      );
                    } else if (chartType === 'bar') {
                      chartElement = (
                        <BarChart {...chartProps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#888" />
                          <YAxis stroke="#888" allowDecimals={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {Object.entries(teams).map(([teamId, team]) => (
                            <Bar
                              key={teamId}
                              dataKey={teamId}
                              name={team.name}
                              fill={team.color}
                              isAnimationActive
                            />
                          ))}
                        </BarChart>
                      );
                    }
                    return (
                      <ChartContainer config={{}}>
                        <ResponsiveContainer width="100%" height={280}>
                          {chartElement}
                        </ResponsiveContainer>
                      </ChartContainer>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">{t('noActivityData')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
                        .reduce((sum, day) => sum + (typeof day.visits === 'number' && !isNaN(day.visits) ? day.visits : 0), 0);
                      
                      return (
                        <tr key={team.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{team.name}</td>
                          <td className="py-3 px-4">{team.memberCount}</td>
                          <td className="py-3 px-4">{typeof teamSessions === 'number' && !isNaN(teamSessions) ? teamSessions : 0}</td>
                          <td className="py-3 px-4">Today</td> {/* Placeholder - would use actual data */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}