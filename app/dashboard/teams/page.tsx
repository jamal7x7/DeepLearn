'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { QuickCreateModal } from '@/components/quick-create/quick-create-modal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

import { sendAnnouncementAction } from '@/app/actions/announcement';

export default function TeamsPage() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Announcement state
  const [openAnnouncementTeamId, setOpenAnnouncementTeamId] = useState<number | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementType, setAnnouncementType] = useState<"plain" | "mdx">("plain");

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/manage-users/teams');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (e) {
      toast.error(t('teams.fetchError', 'Failed to fetch teams'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teams on mount
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error(t('teams.enterName', 'Please enter a team name'));
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/manage-users/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: newTeamName }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(t('teams.created', 'Team created'));
        setNewTeamName('');
        fetchTeams();
      }
    } catch {
      toast.error(t('teams.createError', 'Failed to create team'));
    } finally {
      setIsCreating(false);
    }
  };

  // Handler for QuickCreateModal team creation
  const handleQuickTeamCreated = async () => {
    await fetchTeams();
    setShowQuickCreate(false);
  };

  // Send announcement handler
  const handleSendAnnouncement = async (teamId: number) => {
    if (!announcementMessage.trim()) {
      toast.error(t('teams.enterMessage', 'Please enter a message'));
      return;
    }
    setIsSendingAnnouncement(true);
    const result = await sendAnnouncementAction(announcementMessage, [teamId], announcementType);
    setIsSendingAnnouncement(false);
    if (result.success) {
      toast.success(t('teams.announcementSent', 'Announcement sent'));
      setOpenAnnouncementTeamId(null);
      setAnnouncementMessage('');
    } else {
      toast.error(result.message || t('teams.announcementError', 'Failed to send announcement'));
    }
  };

  // Delete team handler
  const handleDeleteTeam = async (teamId: number) => {
    if (!window.confirm(t('teams.confirmDelete', 'Are you sure you want to delete this team?'))) return;
    try {
      const res = await fetch('/api/manage-users/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      if (res.ok) {
        toast.success(t('teams.deleted', 'Team deleted'));
        fetchTeams();
      } else {
        const data = await res.json();
        toast.error(data.error || t('teams.deleteError', 'Failed to delete team'));
      }
    } catch {
      toast.error(t('teams.deleteError', 'Failed to delete team'));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <span className="inline-block text-primary-600">{t('teams.yourTeams', 'Your Teams')}</span>
        <Button
          size="sm"
          variant="default"
          className="ml-auto"
          onClick={() => setShowQuickCreate(true)}
        >
          + {t('teams.createTeam', 'Create Team')}
        </Button>
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('teams.teams', 'Teams')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
              <span className="animate-pulse text-muted-foreground">{t('common.loading', 'Loading...')}</span>
            </div>
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <svg width="64" height="64" fill="none" viewBox="0 0 64 64" className="text-muted-foreground opacity-60">
                <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" />
                <path d="M22 38c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="32" cy="28" r="4" fill="currentColor" />
              </svg>
              <div className="text-lg font-semibold text-muted-foreground">{t('teams.noTeams', 'No teams found.')}</div>
              <Button variant="default" size="lg" onClick={() => setShowQuickCreate(true)}>
                + {t('teams.createTeam', 'Create Your First Team')}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="border rounded-lg px-4 py-3 flex flex-col gap-2 relative bg-card shadow-sm transition hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg uppercase shadow-sm">
                        {team.name.slice(0, 2)}
                      </div>
                      <span className="font-medium text-lg truncate max-w-[120px] group-hover:text-primary-700 transition-colors">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenAnnouncementTeamId(team.id)}
                        aria-label={t('teams.sendAnnouncement', 'Send Announcement')}
                      >
                        {t('teams.sendAnnouncement', 'Send Announcement')}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="ml-1" aria-label={t('teams.moreActions', 'More Actions')}><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTeam(team.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> {t('teams.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {openAnnouncementTeamId === team.id && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="announcementType"
                            value="plain"
                            checked={announcementType === "plain"}
                            onChange={() => setAnnouncementType("plain")}
                            disabled={isSendingAnnouncement}
                          />
                          {t('teams.plainText', 'Plain Text')}
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="announcementType"
                            value="mdx"
                            checked={announcementType === "mdx"}
                            onChange={() => setAnnouncementType("mdx")}
                            disabled={isSendingAnnouncement}
                          />
                          {t('teams.mdx', 'MDX')}
                        </label>
                      </div>
                      <textarea
                        className="w-full border rounded p-2 min-h-[60px] resize-y focus:ring-2 focus:ring-primary-500"
                        placeholder={t('teams.announcementPlaceholder', 'Type your announcement...')}
                        value={announcementMessage}
                        onChange={e => setAnnouncementMessage(e.target.value)}
                        disabled={isSendingAnnouncement}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{announcementMessage.length}/500</span>
                        <Button
                          size="sm"
                          onClick={() => handleSendAnnouncement(team.id)}
                          disabled={isSendingAnnouncement || !announcementMessage.trim()}
                        >
                          {isSendingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : t('teams.send', 'Send')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpenAnnouncementTeamId(null)}
                          disabled={isSendingAnnouncement}
                        >
                          {t('common.cancel', 'Cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('teams.addNewTeam', 'Add New Team')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder={t('teams.teamName', 'Team name')}
              disabled={isCreating}
              required
            />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t('teams.creating', 'Creating...') : t('teams.addTeam', 'Add Team')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowQuickCreate(true)}>
              {t('teams.quickCreate', 'Quick Create')}
            </Button>
          </form>
        </CardContent>
      </Card>
      <QuickCreateModal open={showQuickCreate} onOpenChange={setShowQuickCreate} onTeamCreated={handleQuickTeamCreated} />
    </div>
  );
}