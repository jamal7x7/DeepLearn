'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
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
  const actualDailyData = dailyData;
  
  // Helper: get ISO week number from a date
  function getISOWeekNumber(date: Date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp as any) - (yearStart as any)) / 86400000 + 1) / 7);
  }
  
  const renderActivityChart = (data: ActivityData[], period: ActivityPeriod) => {
    const maxVisits = Math.max(...data.map(d => d.visits));
    return (
      <div className=" relative  mt-4 flex w-full h-36 md:h-40 items-end justify-between gap-1 text-xs text-muted-foreground">
        {data.map((item, i) => {
          const maxBarHeight = 112; // px, matches h-28
          const barValue = maxVisits > 0 ? (item.visits / maxVisits) * maxBarHeight : 0;
          // For tooltip: precompute label
          let tooltipLabel = '';
          if (period === 'month') {
            const tooltipDate = new Date(item.day);
            tooltipLabel = !isNaN(tooltipDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(item.day)
              ? tooltipDate.toLocaleString(i18n.language, { month: 'short' })
              : item.day;
          } else if (period === 'week') {
            if (typeof item.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.day)) {
              const tooltipDate = new Date(item.day);
              if (!isNaN(tooltipDate.getTime())) {
                const weekNum = getISOWeekNumber(tooltipDate);
                tooltipLabel = `${t('weekShort', 'W')}${weekNum}`;
              }
            }
            if (!tooltipLabel) {
              const match = item.day.match(/(Week|W)\s?(\d+)/i);
              if (match) tooltipLabel = `${t('weekShort', 'W')}${match[2]}`;
              else if (/^\d+$/.test(item.day)) tooltipLabel = `${t('weekShort', 'W')}${item.day}`;
              else tooltipLabel = `${t('weekShort', 'W')}?`;
            }
          } else {
            const tooltipDate = new Date(item.day);
            tooltipLabel = !isNaN(tooltipDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(item.day)
              ? tooltipDate.toLocaleString(i18n.language, { weekday: 'short' })
              : item.day;
          }
          return (
            <div key={i} className="flex flex-col items-center w-8 group relative z-10 ">
              {/* Bar is absolutely aligned to the bottom */}
              <div className="relative flex items-end justify-center w-full" style={{ height: maxBarHeight }}>
                <AnimatePresence>
                  <motion.div
                    key={item.visits}
                    initial={{ height: 0 }}
                    animate={{ height: barValue }}
                    exit={{ height: 0 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                    className="absolute bottom-0 w-6 rounded-full border-2 border-blue-300 dark:border-blue-800 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 shadow-xl hover:from-blue-600 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300"
                    style={{ minHeight: item.visits > 0 ? 2 : 0 }}
                    aria-label={t('visits', 'visits')}
                  >
                    {/* Tooltip */}
                    <span className="absolute left-1/2 -top-8 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap z-20">
                      {item.visits} {t('visits', 'visits')}<br />
                      <span className="text-[10px] text-gray-400">{tooltipLabel}</span>
                    </span>
                    {/* Value on bar top for desktop */}
                    <span className="hidden md:block absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-700 dark:text-blue-200">
                      {item.visits}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Always show label under the bar */}
              <span className="mt-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[3.5rem] text-center break-words">
                {(() => {
                  if (period === 'month') {
                    const date = new Date(item.day);
                    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(item.day)
                      ? date.toLocaleString(i18n.language, { month: 'short' })
                      : item.day;
                  }
                  if (period === 'week') {
                    if (typeof item.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.day)) {
                      const date = new Date(item.day);
                      if (!isNaN(date.getTime())) {
                        const weekNum = getISOWeekNumber(date);
                        return `${t('weekShort', 'W')}${weekNum}`;
                      }
                    }
                    const match = item.day.match(/(Week|W)\s?(\d+)/i);
                    if (match) return `${t('weekShort', 'W')}${match[2]}`;
                    if (/^\d+$/.test(item.day)) return `${t('weekShort', 'W')}${item.day}`;
                    return `${t('weekShort', 'W')}?`;
                  }
                  const date = new Date(item.day);
                  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(item.day)
                    ? date.toLocaleString(i18n.language, { weekday: 'short' })
                    : item.day;
                })()}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <Tabs defaultValue="day" className="w-full " dir={isRTL ? 'rtl' : 'ltr'}>
      <TabsList className="flex w-full max-w-full sm:max-w-xs mx-auto bg-muted/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-1 mt-2 mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
        <TabsTrigger value="day" className="flex-1 min-w-0 basis-0 truncate rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-blue-900 dark:data-[state=inactive]:text-blue-100 data-[state=inactive]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-800">{t('day', 'Day')}</TabsTrigger>
        <TabsTrigger value="week" className="flex-1 min-w-0 basis-0 truncate rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-blue-900 dark:data-[state=inactive]:text-blue-100 data-[state=inactive]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-800">{t('week', 'Week')}</TabsTrigger>
        <TabsTrigger value="month" className="flex-1 min-w-0 basis-0 truncate rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:text-blue-900 dark:data-[state=inactive]:text-blue-100 data-[state=inactive]:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-800">{t('month', 'Month')}</TabsTrigger>
      </TabsList>
      <TabsContent value="day" className="space-y-2 p-2 md:p-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 animate-pulse">{dailyTotal} {t('visits', 'visits')}</div>
        </div>
        {renderActivityChart(actualDailyData, 'day')}
      </TabsContent>
      <TabsContent value="week" className="space-y-2 p-2 md:p-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 animate-pulse">{weeklyTotal} {t('visits', 'visits')}</div>
        </div>
        {renderActivityChart(actualWeeklyData, 'week')}
      </TabsContent>
      <TabsContent value="month" className="space-y-2 p-2 md:p-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          <div className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 animate-pulse">{monthlyTotal} {t('visits', 'visits')}</div>
        </div>
        {renderActivityChart(actualMonthlyData, 'month')}
      </TabsContent>
    </Tabs>
  );
}
// Removed outer <Card> and <CardContent> wrappers to avoid duplicated container when used inside a Card.