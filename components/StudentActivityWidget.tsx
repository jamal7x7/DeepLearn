'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ActivityPeriod = 'day' | 'week' | 'month';

type ActivityData = {
  day: string;
  visits: number;
};

interface StudentActivityWidgetProps {
  dailyData: ActivityData[];
  weeklyData?: ActivityData[];
  monthlyData?: ActivityData[];
}

export default function StudentActivityWidget({
  dailyData,
  weeklyData = [],
  monthlyData = [],
}: StudentActivityWidgetProps) {
  const { t } = useTranslation();
  
  // Calculate total visits for each period
  const dailyTotal = useMemo(() => {
    return dailyData.reduce((sum, day) => sum + day.visits, 0);
  }, [dailyData]);
  
  const weeklyTotal = useMemo(() => {
    return weeklyData.reduce((sum, week) => sum + week.visits, 0);
  }, [weeklyData]);
  
  const monthlyTotal = useMemo(() => {
    return monthlyData.reduce((sum, month) => sum + month.visits, 0);
  }, [monthlyData]);
  
  // If no weekly or monthly data provided, use the daily data
  const actualWeeklyData = weeklyData.length > 0 ? weeklyData : dailyData;
  const actualMonthlyData = monthlyData.length > 0 ? monthlyData : dailyData;
  
  const renderActivityChart = (data: ActivityData[]) => {
    const maxVisits = Math.max(...data.map(d => d.visits));
    
    return (
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-16 w-4 bg-muted rounded-full overflow-hidden flex flex-col-reverse">
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('studentEngagement')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="day">{t('daily')}</TabsTrigger>
            <TabsTrigger value="week">{t('weekly')}</TabsTrigger>
            <TabsTrigger value="month">{t('monthly')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="day" className="space-y-2">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{dailyTotal} {t('visits')}</div>
            </div>
            {renderActivityChart(dailyData)}
          </TabsContent>
          
          <TabsContent value="week" className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{weeklyTotal} {t('visits')}</div>
            </div>
            {renderActivityChart(actualWeeklyData)}
          </TabsContent>
          
          <TabsContent value="month" className="space-y-2">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{monthlyTotal} {t('visits')}</div>
            </div>
            {renderActivityChart(actualMonthlyData)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}