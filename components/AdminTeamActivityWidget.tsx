'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

type ActivityData = {
  day: string;
  visits: number;
  teamId?: number;
  teamName?: string;
};

interface Team {
  id: number;
  name: string;
}

interface AdminTeamActivityWidgetProps {
  teams: Team[];
}

export default function AdminTeamActivityWidget({ teams }: AdminTeamActivityWidgetProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityData, setActivityData] = useState<{
    daily: ActivityData[];
    weekly: ActivityData[];
    monthly: ActivityData[];
  }>({ daily: [], weekly: [], monthly: [] });

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

  // Calculate total visits for each period
  const dailyTotal = useMemo(() => {
    return activityData.daily.reduce((sum, day) => sum + day.visits, 0);
  }, [activityData.daily]);

  const weeklyTotal = useMemo(() => {
    return activityData.weekly.reduce((sum, week) => sum + week.visits, 0);
  }, [activityData.weekly]);

  const monthlyTotal = useMemo(() => {
    return activityData.monthly.reduce((sum, month) => sum + month.visits, 0);
  }, [activityData.monthly]);

  // Aggregate data by day across all teams
  const aggregateDailyData = useMemo(() => {
    const aggregated: Record<string, number> = {};

    activityData.daily.forEach(item => {
      if (aggregated[item.day]) {
        aggregated[item.day] += item.visits;
      } else {
        aggregated[item.day] = item.visits;
      }
    });

    return Object.entries(aggregated).map(([day, visits]) => ({ day, visits }));
  }, [activityData.daily]);

  const aggregateWeeklyData = useMemo(() => {
    const aggregated: Record<string, number> = {};

    activityData.weekly.forEach(item => {
      if (aggregated[item.day]) {
        aggregated[item.day] += item.visits;
      } else {
        aggregated[item.day] = item.visits;
      }
    });

    return Object.entries(aggregated).map(([day, visits]) => ({ day, visits }));
  }, [activityData.weekly]);

  const aggregateMonthlyData = useMemo(() => {
    const aggregated: Record<string, number> = {};

    activityData.monthly.forEach(item => {
      if (aggregated[item.day]) {
        aggregated[item.day] += item.visits;
      } else {
        aggregated[item.day] = item.visits;
      }
    });

    return Object.entries(aggregated).map(([day, visits]) => ({ day, visits }));
  }, [activityData.monthly]);

  const renderActivityChart = (data: ActivityData[]) => {
    if (data.length === 0) {
      return (
        <div className="flex justify-center items-center h-16 text-muted-foreground">
          {t('noActivityData')}
        </div>
      );
    }

    const maxVisits = Math.max(...data.map(d => d.visits));

    return (
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-16 w-5 bg-muted rounded-full overflow-hidden flex flex-col-reverse">
              <div
                className="bg-primary transition-all duration-500"
                style={{ height: `${maxVisits > 0 ? (item.visits / maxVisits) * 100 : 0}%` }}
              />
            </div>
            <span className="mt-1">{item.day}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    // Removed outer Card and CardHeader
    <div className="space-y-3"> {/* Use a div or Fragment */}
        <Tabs defaultValue="day">
           <div className="flex justify-between items-center pb-2"> {/* Container for TabsList and Button */}
             <TabsList className="grid grid-cols-3 ">
               <TabsTrigger value="day">{t('daily')}</TabsTrigger>
               <TabsTrigger value="week">{t('weekly')}</TabsTrigger>
               <TabsTrigger value="month">{t('monthly')}</TabsTrigger>
             </TabsList>
             <Button
               variant="ghost"
               size="sm"
               onClick={fetchAllTeamsActivity}
               disabled={refreshing}
               className="ml-auto" // Push button to the right
               aria-label={refreshing ? t('refreshing') : t('refresh')} // Add aria-label
             >
               <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {/* Remove mr-1 */}
               {/* Text removed */}
             </Button>
           </div>

          <TabsContent value="day" className="space-y-2">
            <div className="flex items-center ">
              <BarChart3 className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-xl font-bold">{dailyTotal} {t('visits')}</div> {/* Reduced font size */}
            </div>
            <div className="bg-muted/50 rounded-md p-2"> {/* Added background to chart area */}
              {renderActivityChart(aggregateDailyData)}
            </div>
          </TabsContent>

          <TabsContent value="week" className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-xl font-bold">{weeklyTotal} {t('visits')}</div> {/* Reduced font size */}
            </div>
            <div className="bg-muted/50 rounded-md p-2"> {/* Added background to chart area */}
              {renderActivityChart(aggregateWeeklyData)}
            </div>
          </TabsContent>

          <TabsContent value="month" className="space-y-2">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-xl font-bold">{monthlyTotal} {t('visits')}</div> {/* Reduced font size */}
            </div>
            <div className="bg-muted/50 rounded-md p-2"> {/* Added background to chart area */}
              {renderActivityChart(aggregateMonthlyData)}
            </div>
          </TabsContent>
        </Tabs>
        {/* Removed extra closing Tabs tag */}
    </div>
  );
}
