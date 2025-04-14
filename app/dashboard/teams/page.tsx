'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { sendAnnouncementAction } from '@/app/actions/announcement';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Announcement state
  const [openAnnouncementTeamId, setOpenAnnouncementTeamId] = useState<number | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementType, setAnnouncementType] = useState<"plain" | "mdx">("plain");

  // Fetch teams on mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/manage-users/teams');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (e) {
      toast.error('Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
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
        toast.success('Team created');
        setNewTeamName('');
        fetchTeams();
      }
    } catch {
      toast.error('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  // Send announcement handler
  const handleSendAnnouncement = async (teamId: number) => {
    if (!announcementMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsSendingAnnouncement(true);
    const result = await sendAnnouncementAction(announcementMessage, [teamId], announcementType);
    setIsSendingAnnouncement(false);
    if (result.success) {
      toast.success('Announcement sent');
      setOpenAnnouncementTeamId(null);
      setAnnouncementMessage('');
    } else {
      toast.error(result.message || 'Failed to send announcement');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Your Teams</h1>
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : teams.length === 0 ? (
            <div className="text-muted-foreground">No teams found.</div>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li key={team.id} className="border rounded px-3 py-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>{team.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenAnnouncementTeamId(team.id)}
                    >
                      Send Announcement
                    </Button>
                  </div>
                  {openAnnouncementTeamId === team.id && (
                    <div className="mt-2 space-y-2">
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
                          Plain Text
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
                          MDX
                        </label>
                      </div>
                      <textarea
                        className="w-full border rounded p-2 min-h-[60px]"
                        placeholder="Type your announcement..."
                        value={announcementMessage}
                        onChange={e => setAnnouncementMessage(e.target.value)}
                        disabled={isSendingAnnouncement}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendAnnouncement(team.id)}
                          disabled={isSendingAnnouncement || !announcementMessage.trim()}
                        >
                          {isSendingAnnouncement ? 'Sending...' : 'Send'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOpenAnnouncementTeamId(null);
                            setAnnouncementMessage('');
                          }}
                          disabled={isSendingAnnouncement}
                        >
                          Cancel
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
          <CardTitle>Add New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeam} className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="Team name"
              disabled={isCreating}
              required
            />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Add Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}