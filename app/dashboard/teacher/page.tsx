'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Bell, Users, BarChart3, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementCard, AnnouncementCardProps } from '@/components/AnnouncementCard';
import { useTranslation } from 'react-i18next';
import HeadingSmall from '@/components/heading-small';
import StudentActivityWidget from '@/components/StudentActivityWidget';

type Announcement = AnnouncementCardProps;
type TeamData = {
  id: number;
  name: string;
  memberCount: number;
};

type ActivityData = {
  day: string;
  visits: number;
};

export default function TeacherDashboardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'team'
  const [filterTeam, setFilterTeam] = useState('all');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ActivityData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ActivityData[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const { t } = useTranslation();

  // Fetch teacher's teams and their announcements
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from the teacher dashboard API
        const response = await fetch('/api/teacher/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        // Set state with the fetched data
        setTeams(data.teams || []);
        setAnnouncements(data.announcements || []);
        setTotalStudents(data.totalStudents || 0);
        setActivityData(data.activityData || []);
        setWeeklyData(data.weeklyData || []);
        setMonthlyData(data.monthlyData || []);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, []);


  // Sort and filter announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];
    
    // Filter by team if not 'all'
    if (filterTeam !== 'all') {
      filtered = filtered.filter(a => a.teamName === filterTeam);
    }
    
    // Sort by date (newest first) or by team name
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } else if (sortBy === 'team') {
      filtered.sort((a, b) => a.teamName.localeCompare(b.teamName));
    }
    
    return filtered;
  }, [announcements, sortBy, filterTeam]);

  // Calculate engagement metrics
  const weeklyVisits = useMemo(() => {
    return activityData.reduce((sum, day) => sum + day.visits, 0);
  }, [activityData]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <HeadingSmall 
        title={t('teacherDashboard')} 
        description={t('manageYourClassesAndAnnouncements')} 
      />
      
      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 ">
        {/* Team Announcements Section - Takes 3/4 of the width on large screens */}
        <div className="lg:col-span-3 ">
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 ">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0">{t('teamAnnouncements')}</h2>
              
              <div className="flex space-x-2">
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('filterByTeam')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTeams')}</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('dateNewestFirst')}</SelectItem>
                    <SelectItem value="team">{t('teamName')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md bg-card/50">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>{t('noAnnouncementsFound')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Analytics Widgets - Takes 1/4 of the width on large screens */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Total Students Widget */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{totalStudents}</div>
              </div>
            </CardContent>
          </Card>
          
          {/* Student Activity Widget */}
          <StudentActivityWidget dailyData={activityData} weeklyData={weeklyData} monthlyData={monthlyData} />
          
          {/* Team Activity Widget */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('teamActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between">
                    <span className="text-sm">{team.name}</span>
                    <span className="text-sm font-medium">{team.memberCount} {t('students')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}