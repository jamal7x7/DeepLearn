"use client";

import { Users, Activity, BarChart2, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardHeroStatsProps {
  totalStudents: number;
  engagementRate: number;
  teamActivity: number;
  isRTL?: boolean;
}

type Stat = {
  key: string;
  icon: LucideIcon;
  color: string;
  tooltip: string;
  value: number;
  label: string;
  suffix?: string;
};

const stats: Omit<Stat, 'value' | 'label'>[] = [
  {
    key: 'totalStudents',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    tooltip: 'totalStudentsTooltip',
  },
  {
    key: 'engagementRate',
    icon: Activity,
    color: 'bg-green-100 text-green-600',
    tooltip: 'engagementRateTooltip',
    suffix: '%',
  },
  {
    key: 'teamActivity',
    icon: BarChart2,
    color: 'bg-purple-100 text-purple-600',
    tooltip: 'teamActivityTooltip',
  },
];

export function DashboardHeroStats({ totalStudents, engagementRate, teamActivity, isRTL }: DashboardHeroStatsProps) {
  const { t } = useTranslation();
  const data: Stat[] = [
    { ...stats[0], value: totalStudents, label: t('totalStudents', 'Total Students') },
    { ...stats[1], value: engagementRate, label: t('engagementRate', 'Engagement Rate'), suffix: '%' },
    { ...stats[2], value: teamActivity, label: t('teamActivity', 'Team Activity') },
  ];

  return (
    <section
      className={cn(
        'w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8',
        isRTL ? 'direction-rtl' : 'direction-ltr'
      )}
    >
      {data.map(({ key, icon: Icon, value, label, color, tooltip, suffix = '' }) => (
        <TooltipProvider key={key} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-4 rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition hover:shadow-md',
                  color
                )}
                tabIndex={0}
                aria-label={label}
              >
                <div className="flex items-center justify-center rounded-full w-12 h-12 bg-opacity-50">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-2xl font-bold">
                    {value}
                    {suffix ? <span className="text-base font-medium ml-1">{suffix}</span> : null}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">{label}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side={isRTL ? 'left' : 'right'}>
              {t(tooltip, label)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </section>
  );
}

export default DashboardHeroStats;
