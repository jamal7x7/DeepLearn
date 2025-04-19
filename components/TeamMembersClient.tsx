'use client'
import React, { useState, useRef, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import { Users, MoreVertical, Trash2, Plus, Shield, BookUser, GraduationCap as GraduationCapIcon, Users2, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Jdenticon from "react-jdenticon";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Explicitly added import for Button
import TeamAnnouncementHistory from "@/components/TeamAnnouncementHistory";
import { useUser } from '@/lib/auth';
import type { User } from '@/lib/db/schema';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';


import { Muted } from "./ui/typography";

// Use local TeamData interface
export interface TeamData {
  teamId: number;
  teamName: string;
  userRole: string;
  type: string;
  order?: number;
  members: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  }[];
}

// Helper for color coding by team type
const TEAM_TYPE_COLORS: Record<string, string> = {
  'admin': 'border-red-500 shadow-red-200/40',
  'teacher': 'border-blue-500 shadow-blue-200/40',
  'student': 'border-green-500 shadow-green-200/40',
  'default': 'border-muted-foreground/10 shadow-primary/10',
};

function getTeamCardColor(type?: string) {
  return TEAM_TYPE_COLORS[type?.toLowerCase() ?? 'default'] ?? TEAM_TYPE_COLORS['default'];
}

// 1. Custom icons for team type
const TEAM_TYPE_ICONS: Record<string, React.ReactNode> = {
  'admin': <Shield className="w-7 h-7 text-red-500" aria-label="Admin Team" />, // security icon
  'teacher': <BookUser className="w-7 h-7 text-blue-500" aria-label="Teacher Team" />, // teacher icon
  'student': <GraduationCapIcon className="w-7 h-7 text-green-500" aria-label="Student Team" />, // student icon
  'default': <Users className="w-7 h-7 text-primary" aria-label="Team" />,
};

function getTeamTypeIcon(type?: string) {
  return TEAM_TYPE_ICONS[type?.toLowerCase() ?? 'default'] ?? TEAM_TYPE_ICONS['default'];
}
function getTeamTypeJDentIcon(typeOption? : any) {
  return {jdenticon: <Jdenticon size={28} value={String(typeOption?.value)} className={String(typeOption?.jdenticon)} />}
}

const TEAM_TYPE_OPTIONS = [
  { value: "class", label: "Class", icon: <GraduationCapIcon className="w-5 h-5 text-blue-500" aria-label="Class" />, bg: "bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600" , color: "text-blue-500", jdenticon: " rounded-full border-8 border-blue-500 bg-white dark:bg-muted"},
  { value: "club", label: "Club", icon: <Users2 className="w-5 h-5 text-green-500" aria-label="Club" />, bg: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600" , color: "text-green-500", jdenticon: " rounded-full border-8 border-green-500 bg-white dark:bg-muted"},
  { value: "study group", label: "Study Group", icon: <BookOpen className="w-5 h-5 text-purple-500" aria-label="Study Group" />, bg: "bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600" , color: "text-purple-500", jdenticon: " rounded-full border-8 border-purple-500 bg-white dark:bg-muted"},
  { value: "other", label: "Other", icon: <Sparkles className="w-5 h-5 text-yellow-500" aria-label="Other" />, bg: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600" , color: "text-yellow-500", jdenticon: " rounded-full border-8 border-yellow-500 bg-white dark:bg-muted"},
];

function CreateNewTeamModal({ open, onOpenChange, onTeamCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onTeamCreated: (optimisticTeam: { name: string; type: string }) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [type, setType] = useState("class");
  const [isCreating, setIsCreating] = useState(false);
  const [optimisticTeam, setOptimisticTeam] = useState<{ name: string; type: string } | null>(null);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    setOptimisticTeam({ name, type });
    onTeamCreated({ name, type }); // Optimistically add to UI immediately
    setTimeout(() => {
      setName("");
      setType("class");
      setOptimisticTeam(null);
      setIsCreating(false);
      onOpenChange(false);
    }, 600); // Close modal quickly for perceived speed
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-lg">
        <DialogHeader>
          <DialogTitle>{t('createNewTeam', 'Create New Team')}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleCreateTeam}>
          <div>
            <Label htmlFor="team-name">{t('teamName', 'Team Name')}</Label>
            <Input id="team-name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Math Club" />
          </div>
          <div>
            <Label>{t('type', 'Type')}</Label>
            <div className="flex gap-2 mt-1">
              {TEAM_TYPE_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  className={`flex items-center gap-1 px-3 py-2 rounded border transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 text-sm font-medium ${type === opt.value ? opt.bg : 'bg-white dark:bg-muted border-gray-200 dark:border-muted-foreground/20 hover:bg-gray-50 dark:hover:bg-muted/60'}`}
                  aria-pressed={type === opt.value}
                  aria-label={opt.label}
                  tabIndex={0}
                  onClick={() => setType(opt.value)}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={isCreating || !name.trim()} className="mt-2">
            {isCreating ? t('creating', 'Creating...') : t('create', 'Create')}
          </Button>
        </form>
        {optimisticTeam && (
          <div className="mt-4 animate-pulse">
            <div className="flex items-center gap-2">
              {TEAM_TYPE_OPTIONS.find(o => o.value === optimisticTeam.type)?.icon}
              <span className="font-semibold">{optimisticTeam.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{optimisticTeam.type}</span>
              <span className="ml-2 text-blue-500 animate-pulse">{t('creating', 'Creating...')}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Inline YourTeamsGrid (copied from previous context)
function TeamCard({ team, onSelect, onRemove }: { team: TeamData, onSelect: (team: TeamData) => void, onRemove: (teamId: number) => void }) {
  const { t } = useTranslation();
  return (
    <Card
      tabIndex={0}
      role="button"
      aria-label={t('viewTeamDetails', { name: team.teamName })}
      className="group transition-all duration-150 ease-in-out rounded-xl border bg-card text-card-foreground shadow hover:shadow-xl focus:ring-2 focus:ring-primary/60 focus:outline-none cursor-pointer min-h-[120px] flex flex-col justify-between"
      onClick={() => onSelect(team)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(team); }}
    >
      <CardContent className="flex flex-col items-center gap-3 p-5">
        <div className="flex items-center gap-2 w-full justify-between">
          <span className="text-base font-medium truncate max-w-[65%]">{team.teamName}</span>
          <Badge variant="outline" className="text-xs px-2 py-0.5 lowercase">{team.type}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"><MoreVertical className="w-5 h-5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelect(team)}>{t('view')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(team.teamId)} className="text-destructive">{t('remove', 'Remove')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-center gap-0.5">
          <TooltipProvider delayDuration={200}>
            {team.members.slice(0, 4).map((member, idx) => (
              <Tooltip key={member.email || member.id || idx}>
                <TooltipTrigger asChild>
                  <span
                    className="relative inline-block fade-in"
                    style={{ zIndex: 10 - idx, marginLeft: idx === 0 ? 0 : '-0.7em' }}
                  >
                    <Jdenticon size={22} value={String(member.email || member.id || 'unknown')} className="rounded-full border border-background bg-white dark:bg-muted" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{member.name || member.email}</TooltipContent>
              </Tooltip>
            ))}
            {team.members.length > 4 && (
              <span className="ml-2 text-xs text-muted-foreground">+{team.members.length - 4}</span>
            )}
          </TooltipProvider>
        </div>
        {team.members.some(m => m.role === 'teacher') && (
          <span className="text-xs text-primary font-semibold">{t('teacher', 'Teacher')}</span>
        )}
      </CardContent>
    </Card>
  );
}

function TeamCardSkeleton() {
  return (
    <Card className="rounded-xl min-h-[120px] flex flex-col justify-between">
      <CardContent className="flex flex-col items-center gap-3 p-5">
        <div className="flex items-center gap-2 w-full justify-between">
          <Skeleton className="w-24 h-5 rounded" />
          <Skeleton className="w-10 h-5 rounded" />
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
        <div className="flex items-center justify-center gap-0.5">
          {[...Array(3)].map((_, idx) => (
            <Skeleton key={idx} className="w-6 h-6 rounded-full" style={{ marginLeft: idx === 0 ? 0 : '-0.7em' }} />
          ))}
        </div>
        <Skeleton className="w-12 h-4 rounded" />
      </CardContent>
    </Card>
  );
}

function YourTeamsGrid({ teams, onSelectTeam, onRemoveTeam, isLoading }: { teams: TeamData[]; onSelectTeam: (team: TeamData) => void; onRemoveTeam: (teamId: number) => void; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {isLoading
        ? [...Array(4)].map((_, idx) => <TeamCardSkeleton key={idx} />)
        : teams.map((team) => (
            <TeamCard key={team.teamId} team={team} onSelect={onSelectTeam} onRemove={onRemoveTeam} />
          ))}
    </div>
  );
}

// Fix: Add explicit type for TeamMembersClient props
interface TeamMembersClientProps {
  teams: TeamData[];
}

// --- Fix: Normalize backend team object for UI ---
function normalizeMember(member: any): { id: number; name: string; email: string; role: string } {
  return {
    id: member.id,
    name: member.name ?? member.email ?? '',
    email: member.email ?? '',
    role: member.role ?? 'teacher',
  };
}

function normalizeTeam(team: any): TeamData {
  return {
    teamId: team.id ?? team.teamId,
    teamName: team.name ?? team.teamName ?? '',
    userRole: team.userRole ?? 'teacher',
    type: team.type ?? 'class',
    order: team.order ?? 0,
    members: (team.members || []).map(normalizeMember),
  };
}

function useMergedTeams(teams: TeamData[], pendingTeams: TeamData[]) {
  // Defensive: Only use .toLowerCase() if teamName is defined and is a string
  const confirmedNames = new Set(
    teams.map(t => (typeof t.teamName === 'string' ? t.teamName.toLowerCase() : ''))
  );
  return [
    ...teams,
    ...pendingTeams.filter(pt => {
      if (typeof pt.teamName !== 'string') return true;
      return !confirmedNames.has(pt.teamName.toLowerCase());
    })
  ];
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

function SortableTeamCard({ team, index, selected, onSelect, onRemove, children }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: String(team.teamId) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    boxShadow: isDragging ? '0 0 0 2px var(--primary)' : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      role="button"
      aria-label={team.teamName}
      className={`mb-2 rounded-lg border border-transparent hover:border-primary/30 transition group ${selected ? 'border-primary bg-muted/50' : ''}`}
      onClick={() => onSelect(team)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(team); }}
    >
      {children}
    </div>
  );
}

function TeamMembersClient(props: TeamMembersClientProps) {
  const { t } = useTranslation();
  const { userPromise } = useUser();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    userPromise.then(setUser);
  }, [userPromise]);

  // Local state for teams, so we can update optimistically
  const [teams, setTeams] = useState<TeamData[]>([...props.teams].sort((a: TeamData, b: TeamData) => (a.order ?? 0) - (b.order ?? 0)).map(normalizeTeam));
  const [pendingTeams, setPendingTeams] = useState<TeamData[]>([]); // For optimistic UI
  const [orderedTeams, setOrderedTeams] = useState<TeamData[]>(teams);
  useEffect(() => { setOrderedTeams([...teams].sort((a: TeamData, b: TeamData) => (a.order ?? 0) - (b.order ?? 0))); }, [teams]);

  // --- Team details modal/drawer state ---
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState<{ email: string; status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Handler: open team details
  const handleViewTeam = (team: TeamData) => setSelectedTeam(team);
  // Handler: close modal
  const handleCloseDetails = () => setSelectedTeam(null);

  // Handler: invite member (mock, replace with real API)
  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setPendingInvites((prev) => [...prev, { email: inviteEmail, status: 'pending' }]);
    setInviteEmail('');
    setShowInvite(false);
    toast.success(t('inviteSent', 'Invitation sent!'));
  };

  // Handler: remove member (mock, replace with real API)
  const handleRemoveMember = (memberId: number) => {
    if (!selectedTeam) return;
    // Confirmation dialog
    if (!window.confirm(t('removeMemberConfirm', 'Remove this member?'))) return;
    // Remove from UI (replace with API call)
    setSelectedTeam({
      ...selectedTeam,
      members: selectedTeam.members.filter(m => m.id !== memberId),
    });
    toast.success(t('memberRemoved', 'Member removed.'));
  };

  // Handler: leave team (mock, replace with real API)
  const handleLeaveTeam = () => {
    if (!selectedTeam) return;
    if (!window.confirm(t('leaveTeamConfirm', 'Are you sure you want to leave this team?'))) return;
    handleCloseDetails();
    toast.success(t('leftTeam', 'You left the team.'));
  };

  // Handler: refresh teams from backend
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/teams");
      const data = await res.json();
      setTeams((data?.length ? data : []).map(normalizeTeam).sort((a: TeamData, b: TeamData) => (a.order ?? 0) - (b.order ?? 0)));
    } catch {
      toast.error(t('teams.fetchError', 'Failed to fetch teams'));
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic create handler
  const handleTeamCreated = (optimisticTeam: { name: string; type: string }) => {
    const fakeId = Date.now();
    // Always include teacher in optimistic team
    const optimisticMembers = user
      ? [{ id: user.id, name: user.name, email: user.email, role: 'teacher' }]
      : [{ id: fakeId, name: 'Teacher', email: `teacher-${fakeId}@fake.com`, role: 'teacher' }];
    const newTeam: TeamData = {
      teamId: fakeId,
      teamName: optimisticTeam.name,
      userRole: 'teacher',
      type: optimisticTeam.type,
      order: 0,
      members: optimisticMembers,
    };
    setPendingTeams((prev) => [...prev, newTeam]);
    fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: optimisticTeam.name, type: optimisticTeam.type }),
    })
      .then((res) => res.json())
      .then((json) => {
        setPendingTeams((prev) => prev.filter((t) => t.teamId !== fakeId));
        if (json.success && json.team) {
          setTeams((prev) => [...prev, normalizeTeam(json.team)]);
        } else {
          toast.error(json.error || t('teams.createError', 'Failed to create team'));
        }
      })
      .catch(() => {
        setPendingTeams((prev) => prev.filter((t) => t.teamId !== fakeId));
        toast.error(t('teams.createError', 'Failed to create team'));
      });
  };

  // Optimistic remove handler
  const handleRemoveTeam = (teamId: number) => {
    // Find the team to restore if needed
    const removedTeam = teams.find(t => t.teamId === teamId) || pendingTeams.find(t => t.teamId === teamId);
    // Optimistically remove from UI
    setTeams(prev => prev.filter(t => t.teamId !== teamId));
    setPendingTeams(prev => prev.filter(t => t.teamId !== teamId));
    // Backend call
    fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          toast.error(json.error || t('teams.removeError', 'Failed to remove team'));
          // Restore the team only if backend failed
          if (removedTeam) {
            setTeams(prev => [removedTeam, ...prev]);
          }
        }
      })
      .catch(() => {
        toast.error(t('teams.removeError', 'Failed to remove team'));
        if (removedTeam) {
          setTeams(prev => [removedTeam, ...prev]);
        }
      });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // --- Persist order to backend on drag end ---
  async function persistTeamOrder(ids: number[]) {
    try {
      await fetch('/api/teams/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: ids }),
      });
    } catch {
      toast.error('Failed to save team order');
    }
  }

  function handleDndKitDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTeams.findIndex(t => String(t.teamId) === active.id);
    const newIndex = orderedTeams.findIndex(t => String(t.teamId) === over.id);
    const newOrder = arrayMove(orderedTeams, oldIndex, newIndex);
    setOrderedTeams(newOrder);
    persistTeamOrder(newOrder.map(t => t.teamId));
  }

  const mergedTeams = useMergedTeams(teams, pendingTeams);

  return (
    <div className="flex h-full min-h-[60vh] border-0 border-secondary rounded-lg overflow-hidden">
      {/* Sidebar: Teams */}
      <aside className="w-[380px] min-w-[220px] max-w-[100vw] bg-background border-r border-secondary flex flex-col">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDndKitDragEnd}>
          <SortableContext items={orderedTeams.map(t => String(t.teamId))} strategy={verticalListSortingStrategy}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {orderedTeams.map((team, idx) => (
                <SortableTeamCard
                  key={team.teamId}
                  team={team}
                  index={idx}
                  selected={selectedTeam?.teamId === team.teamId}
                  onSelect={setSelectedTeam}
                  onRemove={handleRemoveTeam}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="border-3 p-2  rounded-lg"> 
                    {TEAM_TYPE_OPTIONS.find(t => t.value === team.type)?.icon}
                    {/* {getTeamTypeJDentIcon(TEAM_TYPE_OPTIONS.find(t => t.value === team.type))?.jdenticon} */}
                      {/* <Jdenticon size={28} value={String(team.teamName || team.teamId)} className=" rounded-full border-8 border-yellow-500 bg-white dark:bg-muted" /> */}
                    </div>
                    <span className="flex-1 truncate text-base font-medium">{team.teamName} </span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 lowercase">{team.type}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"><MoreVertical className="w-5 h-5" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedTeam(team)}>{t('view')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRemoveTeam(team.teamId)} className="text-destructive">{t('remove', 'Remove')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SortableTeamCard>
              ))}
              <button className="w-full mt-4 py-2 border-2 border-dashed border-primary/20 rounded-lg flex items-center justify-center gap-2 text-primary hover:border-primary/50 transition text-lg font-semibold" onClick={() => setShowCreate(true)}>
                <Plus className="w-6 h-6" /> <Muted>{t('createNewTeam')}</Muted>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </aside>
      {/* Main: Members of selected team */}
      <main className="flex-1 bg-background p-8 overflow-y-auto">
        {selectedTeam ? (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Jdenticon size={32} value={String(selectedTeam.teamName || selectedTeam.teamId)} className="rounded-full border border-background bg-white dark:bg-muted" />
              {selectedTeam.teamName}
              <Badge variant="outline" className="ml-2 text-xs px-2 py-0.5 lowercase">{selectedTeam.type}</Badge>
            </h2>
            <div className="space-y-3">
              {selectedTeam.members.length === 0 && (
                <div className="text-muted-foreground italic">{t('noMembers', 'No members in this team yet.')}</div>
              )}
              {selectedTeam.members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 border-b border-secondary">
                  <Jdenticon size={26} value={String(member.email || member.id)} className="rounded-full border border-background bg-white dark:bg-muted" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate">{member.name || member.email}</span>
                    {member.role === 'teacher' && <span className="ml-2 text-xs text-primary font-semibold">{t('teacher', 'Teacher')}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-lg">{t('selectTeam', 'Select a team to view members')}</div>
        )}
      </main>
      <CreateNewTeamModal open={showCreate} onOpenChange={setShowCreate} onTeamCreated={handleTeamCreated} />
    </div>
  );
}

// ... (rest of the code remains the same)

// Export as default for Next.js dynamic import compatibility
export default TeamMembersClient;