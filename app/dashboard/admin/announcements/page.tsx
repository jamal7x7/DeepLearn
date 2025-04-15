'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardDescription, CardFooter
import { Bell, RefreshCw, Filter, Send, Plus, Loader2, ListChecks, Clock, Pencil, Trash2 } from 'lucide-react'; // Added Loader2, ListChecks, Clock, Pencil, Trash2
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementCard, AnnouncementCardProps } from "@/components/AnnouncementCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendAnnouncementAction } from '@/app/actions/announcement'; // Import the server action
import { toast } from 'sonner'; // Import toast for notifications

type Announcement = AnnouncementCardProps & {
  teamId: number;
};

interface Team {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

export default function AdminAnnouncements() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newAnnouncement, setNewAnnouncement] = useState({
    // title: '', // Removed title
    content: '',
    targetTeamId: 'all',
    type: 'info' // Note: This type ('info', 'warning', 'urgent') is not used by the backend action
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    unreadAnnouncements: 0, // Note: This is currently a placeholder calculation
    announcementsToday: 0
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
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  // Fetch all announcements
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
      
      // Calculate announcement stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const announcementsToday = combinedAnnouncements.filter(
        a => new Date(a.sentAt) >= today
      ).length;
      
      // Placeholder for unread - in a real app, this would track which announcements each user has read
      const unreadAnnouncements = Math.floor(combinedAnnouncements.length * 0.3);
      
      setStats({
        totalAnnouncements: combinedAnnouncements.length,
        unreadAnnouncements,
        announcementsToday
      });
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teams, refreshing]);

  // Initial load
  useEffect(() => {
    if (teams.length > 0) {
      fetchAllAnnouncements();
    }
  }, [teams, fetchAllAnnouncements]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllAnnouncements(true);
  };

  // Filter announcements by team
  const filteredAnnouncements = filterTeamId === 'all'
    ? announcements
    : announcements.filter(announcement => announcement.teamId === parseInt(filterTeamId));

  // Placeholder functions for Edit/Delete
  const handleEdit = (announcementId: number) => {
    console.log("Edit announcement:", announcementId);
    toast.info("Edit functionality not yet implemented.");
  };
  const handleDelete = (announcementId: number) => {
    console.log("Delete announcement:", announcementId);
    toast.info("Delete functionality not yet implemented.");
  };

  // Handle new announcement submission
  const handleSubmitAnnouncement = async () => {
    setIsSubmitting(true);
    try {
      // Determine target team IDs
      const targetTeamIds = newAnnouncement.targetTeamId === 'all'
        ? teams.map(team => team.id)
        : [parseInt(newAnnouncement.targetTeamId)];

      if (targetTeamIds.length === 0 && newAnnouncement.targetTeamId !== 'all') {
          toast.error(t('error.selectValidTeam'));
          setIsSubmitting(false);
          return;
      }
      if (!newAnnouncement.content.trim()) {
          toast.error(t('error.announcementContentEmpty'));
          setIsSubmitting(false);
          return;
      }

      // Call the server action
      // Note: The form has 'title' and 'content', but the action only takes 'content'.
      // We are sending 'content' from the form. The 'type' from the form ('info', 'warning', 'urgent')
      // doesn't match the action's expected type ('plain', 'mdx'). We default to 'plain'.
      const result = await sendAnnouncementAction(
        newAnnouncement.content, // Using content field
        targetTeamIds,
        'plain' // Defaulting type to 'plain'
      );

      if (result.success) {
        toast.success(t('success.announcementSent'));
        // Close dialog and reset form
        setDialogOpen(false);
        setNewAnnouncement({
          // title: '', // Removed title
          content: '',
          targetTeamId: 'all',
          type: 'info'
        });
        // Refresh announcements to show the new one
        fetchAllAnnouncements(true);
      } else {
        toast.error(t('error.sendingAnnouncement') + `: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(t('error.sendingAnnouncementUnexpected'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('announcements')}</h1>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('createAnnouncement')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewAnnouncement')}</DialogTitle>
                <DialogDescription>
                  {t('createAnnouncementDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Title Input Removed */}
                <div className="grid gap-2">
                  <Label htmlFor="content">{t('content')}</Label>
                  <Textarea 
                    id="content" 
                    rows={5}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team">{t('targetTeam')}</Label>
                  <Select 
                    value={newAnnouncement.targetTeamId}
                    onValueChange={(value) => setNewAnnouncement({...newAnnouncement, targetTeamId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTeams')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">{t('announcementType')}</Label>
                  <Select 
                    value={newAnnouncement.type}
                    onValueChange={(value) => setNewAnnouncement({...newAnnouncement, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{t('information')}</SelectItem>
                      <SelectItem value="warning">{t('warning')}</SelectItem>
                      <SelectItem value="urgent">{t('urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSubmitAnnouncement} disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSubmitting ? t('sending') : t('send')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalAnnouncements')}</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('unreadAnnouncements')}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadAnnouncements}</div>
            <p className="text-xs text-muted-foreground">{t('placeholderValue')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('announcementsToday')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcementsToday}</div>
            {/* <p className="text-xs text-muted-foreground">+1 since yesterday</p> */}
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allAnnouncements')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 ">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement, index) => (
                <Card key={announcement.id || index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{t('announcement')}</CardTitle>
                        <CardDescription className="text-xs">
                          {t('sentTo')}: {teams.find(t => t.id === announcement.teamId)?.name || t('allTeams')}
                        </CardDescription>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1">
                        {new Date(announcement.sentAt).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{announcement.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-3">
                     {/* Added onClick handlers calling placeholder functions */}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(announcement.id)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t('edit')}</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(announcement.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('delete')}</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noAnnouncementsFound')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}