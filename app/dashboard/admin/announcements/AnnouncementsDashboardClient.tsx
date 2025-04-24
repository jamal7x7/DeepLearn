"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw, Filter, Send, Plus, Loader2, ListChecks, Clock, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementCard } from "@/components/AnnouncementCard";
import type { AnnouncementCardProps } from '@/components/AnnouncementCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  sendAnnouncementAction, 
  updateAnnouncementAction, 
  deleteAnnouncementAction, 
  reassignAnnouncementAction, 
  bulkDeleteAnnouncementsAction, 
  bulkReassignAnnouncementsAction, 
} from '@/app/actions/announcement';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DateTimePicker } from "@/components/date-time-picker";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

// --- Announcement type with senderName for search ---
export type Announcement = Omit<AnnouncementCardProps, 'id'> & { id: number };

interface Team {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

interface AnnouncementsDashboardClientProps {
  announcements: Announcement[];
  stats: {
    totalAnnouncements: number;
    unreadAnnouncements: number;
    announcementsToday: number;
  };
  teams: Team[];
  users: any[];
  session: any;
}

export function AnnouncementsDashboardClient({
  announcements: initialAnnouncements,
  stats: initialStats,
  teams: initialTeams,
  users,
  session
}: AnnouncementsDashboardClientProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newAnnouncement, setNewAnnouncement] = useState({
    content: '',
    targetTeamId: 'all',
    type: 'plain',
    schedule: '',
    importance: 'normal'
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchSender, setSearchSender] = useState('');
  const [dateRange, setDateRange] = useState<{from: Date|undefined, to: Date|undefined}>({from: undefined, to: undefined});
  const [searchDebounced, setSearchDebounced] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Dialog/modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState({ content: '', type: 'info', teamId: 0 });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignAnnouncement, setReassignAnnouncement] = useState<Announcement | null>(null);
  const [reassignTeams, setReassignTeams] = useState<number[]>([]);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [bulkReassignModalOpen, setBulkReassignModalOpen] = useState(false);
  const [bulkReassignTeams, setBulkReassignTeams] = useState<number[]>([]);
  const [bulkReassignLoading, setBulkReassignLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // --- State for Modals ---
  const [viewedAnnouncement, setViewedAnnouncement] = useState<Announcement | null>(null);
  const [editAnnouncementModal, setEditAnnouncementModal] = useState<Announcement | null>(null);
  const [deleteAnnouncementModal, setDeleteAnnouncementModal] = useState<Announcement | null>(null);
  const [reassignAnnouncementModal, setReassignAnnouncementModal] = useState<Announcement | null>(null);

  // --- Handler Implementations ---
  function handleView(announcement: Announcement) {
    setViewedAnnouncement(announcement);
  }
  function handleEdit(announcement: Announcement) {
    openEditModal(announcement);
  }
  function handleDelete(announcement: Announcement) {
    openDeleteDialog(announcement.id);
  }
  function handleReassign(announcement: Announcement) {
    openReassignModal(announcement);
  }

  // --- Modal Close Handlers (renamed for uniqueness) ---
  function closeViewAnnouncementModal() { setViewedAnnouncement(null); }
  function closeEditAnnouncementModal() { setEditAnnouncementModal(null); }
  function closeDeleteAnnouncementModal() { setDeleteAnnouncementModal(null); }
  function closeReassignAnnouncementModal() { setReassignAnnouncementModal(null); }

  // Helper for create announcement form submit
  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSubmitAnnouncement();
  };

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
      const result = await sendAnnouncementAction(
        newAnnouncement.content, // Using content field
        targetTeamIds,
        (newAnnouncement.type === 'mdx' || newAnnouncement.type === 'plain' ? newAnnouncement.type : 'plain'),
        newAnnouncement.schedule,
        newAnnouncement.importance
      );

      if (result.success) {
        toast.success(t('success.announcementSent'));
        // Close dialog and reset form
        setDialogOpen(false);
        setNewAnnouncement({
          content: '',
          targetTeamId: 'all',
          type: 'plain',
          schedule: '',
          importance: 'normal'
        });
        // Refresh announcements to show the new one
        // fetchAllAnnouncements(true);
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

  // --- Bulk actions ---
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteLoading(true);
    const res = await bulkDeleteAnnouncementsAction(selectedIds);
    setBulkDeleteLoading(false);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) setSelectedIds([]);
    // fetchAllAnnouncements(true);
  };
  const handleBulkReassign = () => setBulkReassignModalOpen(true);

  // --- Table checkbox logic ---
  const toggleSelect = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const selectAll = () => {
    // setSelectedIds(filteredAnnouncements.map(a => a.id));
  };
  const clearAll = () => {
    setSelectedIds([]);
  };

  // --- Modal open/close handlers ---
  const openEditModal = (a: Announcement) => {
    setEditAnnouncement(a);
    setEditForm({ content: a.content ?? '', type: a.type ?? 'info', teamId: a.teamId ?? 0 });
    setEditModalOpen(true);
  };
  const closeEditModal = () => setEditModalOpen(false);

  const openDeleteDialog = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };
  const closeDeleteDialog = () => setDeleteDialogOpen(false);

  const openReassignModal = (a: Announcement) => {
    setReassignAnnouncement(a);
    setReassignTeams([a.teamId ?? 0]);
    setReassignModalOpen(true);
  };
  const closeReassignModal = () => setReassignModalOpen(false);

  // --- Edit, Delete, Reassign submit handlers ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAnnouncement) return;
    setEditLoading(true);
    const res = await updateAnnouncementAction(
      editAnnouncement.id,
      editForm.content,
      (editForm.type === 'mdx' || editForm.type === 'plain' ? editForm.type : 'plain'),
      editForm.teamId ?? 0
    );
    setEditLoading(false);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) setEditModalOpen(false);
    // fetchAllAnnouncements(true);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    // Find the teamId for the announcement being deleted
    const announcement = announcements.find(a => a.id === deleteId);
    const teamId = announcement?.teamId ?? 0;
    const res = await deleteAnnouncementAction(deleteId, teamId);
    setDeleteLoading(false);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) setDeleteDialogOpen(false);
    // fetchAllAnnouncements(true);
  };
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignAnnouncement) return;
    setReassignLoading(true);
    // Use the first selected teamId as the primary one for audit log
    const teamId = reassignTeams[0] ?? 0;
    const res = await reassignAnnouncementAction(reassignAnnouncement.id, reassignTeams, teamId ?? 0);
    setReassignLoading(false);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) setReassignModalOpen(false);
    // fetchAllAnnouncements(true);
  };
  const handleBulkReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkReassignLoading(true);
    const res = await bulkReassignAnnouncementsAction(selectedIds, bulkReassignTeams);
    setBulkReassignLoading(false);
    toast[res.success ? 'success' : 'error'](res.message);
    if (res.success) {
      setBulkReassignModalOpen(false);
      setSelectedIds([]);
    }
    // fetchAllAnnouncements(true);
  };

  // --- Handler Placeholders for Card Actions ---
  // function handleView(announcement: Announcement) {
  //   // TODO: Implement view modal
  //   toast.info('View announcement: ' + (announcement.content || ''));
  // }
  // function handleEdit(announcement: Announcement) {
  //   // TODO: Implement edit modal
  //   toast.info('Edit announcement: ' + (announcement.content || ''));
  // }
  // function handleDelete(announcement: Announcement) {
  //   // TODO: Implement delete confirmation
  //   toast.info('Delete announcement: ' + (announcement.content || ''));
  // }
  // function handleReassign(announcement: Announcement) {
  //   // TODO: Implement reassign modal
  //   toast.info('Reassign announcement: ' + (announcement.content || ''));
  // }

  // --- Fix DateRange Picker Handler ---
  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setDateRange({
      from: range?.from,
      to: range?.to,
    });
  };

  // --- Fix Announcement Type for Card ---
  // Use content as title if no title field, and derive status from type or fallback
  function getAnnouncementTitle(a: Announcement) {
    return a.title || a.content?.slice(0, 32) || 'Untitled';
  }
  function getAnnouncementStatus(a: Announcement) {
    // If status exists, use it; else fallback to type or 'active'
    // @ts-ignore
    return a.status || a.type || 'active';
  }

  // --- Filtered announcements with advanced search ---
  const filteredAnnouncements = announcements.filter(a => {
    // Only show if notifiedAt is set (for scheduled announcements)
    if (a.schedule && !a.notifiedAt) return false;
    const matchesSearch = (a.content ?? '').toLowerCase().includes(searchDebounced.toLowerCase());
    const matchesTeam = filterTeamId === 'all' || String(a.teamId) === filterTeamId;
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesSender = !searchSender || (a.senderName ? a.senderName.toLowerCase() : '').includes(searchSender.toLowerCase());
    const sentDate = a.sentAt ? parseISO(String(a.sentAt)) : new Date();
    const matchesDate = !dateRange.from || !dateRange.to || isWithinInterval(sentDate, { start: dateRange.from, end: dateRange.to });
    return matchesSearch && matchesTeam && matchesType && matchesSender && matchesDate;
  });

  // --- Bulk Selection State ---
  const isAllSelected = announcements.length > 0 && selectedIds.length === announcements.length;
  function handleSelectAll() {
    setSelectedIds(isAllSelected ? [] : announcements.map(a => a.id));
  }
  function handleSelectOne(id: number) {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  }

  // --- Bulk Action Dialog State ---
  const [bulkAction, setBulkAction] = useState<'delete' | 'reassign' | null>(null);
  const [bulkReassignTeamId, setBulkReassignTeamId] = useState<number>(0);
  const [bulkLoading, setBulkLoading] = useState(false);

  // --- RENDER TREE ---
  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6"> 
        <div className="mb-4">
          <h1 className="text-3xl font-bold">{t('announcements')}</h1>
          <p className="text-muted-foreground">{t('announcementsDesc')}</p>
        </div>
        {isMobile ? (
          <Drawer open={dialogOpen} onOpenChange={setDialogOpen} placement="bottom">
            <DrawerTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t('createAnnouncement')}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-lg p-0 rounded-t-xl shadow-2xl border-2 border-primary/10">
              <DrawerHeader className="bg-primary/5 px-6 pt-6 pb-2 rounded-t-xl">
                <DrawerTitle className="text-lg font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  {t('createAnnouncement')}
                </DrawerTitle>
                <DrawerDescription className="text-muted-foreground text-sm mt-1">
                  {t('createAnnouncementDesc')}
                </DrawerDescription>
              </DrawerHeader>
              <form onSubmit={handleCreateAnnouncement} className="space-y-6 px-6 py-6">
                {/* Type: Plain or MDX */}
                <div>
                  <Label htmlFor="type" className="mb-2 block font-medium">{t('type')}</Label>
                  <div className="flex gap-2  mb-2">
                    {(['plain', 'mdx'] as const).map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={newAnnouncement.type === type ? 'default' : 'outline'}
                        className={`capitalize px-4 py-1 rounded transition-colors border
                          ${newAnnouncement.type === type ? 'bg-primary text-primary-foreground dark:bg-secondary dark:text-secondary-foreground' : ''}
                          dark:border-neutral-700 dark:bg-background dark:text-foreground`}
                        aria-pressed={newAnnouncement.type === type}
                        onClick={() => setNewAnnouncement(prev => ({ ...prev, type }))}
                      >
                        {t(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Content */}
                <div>
                  <Label htmlFor="content" className="mb-2 block font-medium">{t('content')}</Label>
                  <Textarea
                    id="content"
                    placeholder={newAnnouncement.type === 'mdx' ? t('announcementContentMDX') : t('announcementContent')}
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    required
                    className="resize-y min-h-[120px] "
                  />
                </div>
                {/* Team to send to */}
                <div>
                  <Label htmlFor="targetTeamId" className="mb-2 block font-medium">{t('team')}</Label>
                  <Select
                    value={String(newAnnouncement.targetTeamId)}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, targetTeamId: val }))}
                  >
                    <SelectTrigger id="targetTeamId" className="w-full">
                      <SelectValue placeholder={t('selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTeams')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Schedule Date */}
                <div>
                  <Label htmlFor="schedule" className="mb-2 block font-medium">{t('schedule')}</Label>
                  <DateTimePicker
                    value={newAnnouncement.schedule ? new Date(newAnnouncement.schedule) : undefined}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, schedule: val ? val.toISOString() : '' }))}
                    className="w-full "
                  />
                </div>
                {/* Importance */}
                <div>
                  <Label htmlFor="importance" className="mb-2 block font-medium">{t('importance')}</Label>
                  <Select
                    value={newAnnouncement.importance || 'normal'}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, importance: val }))}
                  >
                    <SelectTrigger id="importance" className="w-full">
                      <SelectValue placeholder={t('selectImportance')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('low')}</SelectItem>
                      <SelectItem value="normal">{t('normal')}</SelectItem>
                      <SelectItem value="high">{t('high')}</SelectItem>
                      <SelectItem value="urgent">{t('urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DrawerFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full flex gap-2">
                    {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                    {t('sendAnnouncement')}
                  </Button>
                  <DrawerClose asChild>
                    <Button type="button" variant="outline" className="w-full mt-2">
                      {t('cancel')}
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t('createAnnouncement')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-0 rounded-xl shadow-2xl border-2 border-primary/10">
              <DialogHeader className="bg-primary/5 px-6 pt-6 pb-2 rounded-t-xl">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  {t('createAnnouncement')}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm mt-1">
                  {t('createAnnouncementDesc')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAnnouncement} className="space-y-6 px-6 py-6">
                {/* Type: Plain or MDX */}
                <div>
                  <Label htmlFor="type" className="mb-2 block font-medium">{t('type')}</Label>
                  <div className="flex gap-2  mb-2">
                    {(['plain', 'mdx'] as const).map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={newAnnouncement.type === type ? 'default' : 'outline'}
                        className={`capitalize px-4 py-1 rounded transition-colors border
                          ${newAnnouncement.type === type ? 'bg-primary text-primary-foreground dark:bg-secondary dark:text-secondary-foreground' : ''}
                          dark:border-neutral-700 dark:bg-background dark:text-foreground`}
                        aria-pressed={newAnnouncement.type === type}
                        onClick={() => setNewAnnouncement(prev => ({ ...prev, type }))}
                      >
                        {t(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Content */}
                <div>
                  <Label htmlFor="content" className="mb-2 block font-medium">{t('content')}</Label>
                  <Textarea
                    id="content"
                    placeholder={newAnnouncement.type === 'mdx' ? t('announcementContentMDX') : t('announcementContent')}
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    required
                    className="resize-y min-h-[120px] "
                  />
                </div>
                {/* Team to send to */}
                <div>
                  <Label htmlFor="targetTeamId" className="mb-2 block font-medium">{t('team')}</Label>
                  <Select
                    value={String(newAnnouncement.targetTeamId)}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, targetTeamId: val }))}
                  >
                    <SelectTrigger id="targetTeamId" className="w-full">
                      <SelectValue placeholder={t('selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTeams')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Schedule Date */}
                <div>
                  <Label htmlFor="schedule" className="mb-2 block font-medium">{t('schedule')}</Label>
                  <DateTimePicker
                    value={newAnnouncement.schedule ? new Date(newAnnouncement.schedule) : undefined}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, schedule: val ? val.toISOString() : '' }))}
                    className="w-full "
                  />
                </div>
                {/* Importance */}
                <div>
                  <Label htmlFor="importance" className="mb-2 block font-medium">{t('importance')}</Label>
                  <Select
                    value={newAnnouncement.importance || 'normal'}
                    onValueChange={val => setNewAnnouncement(prev => ({ ...prev, importance: val }))}
                  >
                    <SelectTrigger id="importance" className="w-full">
                      <SelectValue placeholder={t('selectImportance')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('low')}</SelectItem>
                      <SelectItem value="normal">{t('normal')}</SelectItem>
                      <SelectItem value="high">{t('high')}</SelectItem>
                      <SelectItem value="urgent">{t('urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full flex gap-2">
                    {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                    {t('sendAnnouncement')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-2 md:space-y-0 mb-4">
        <Input
          placeholder={t('searchAnnouncements')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-64"
          aria-label={t('searchAnnouncements')}
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
            <SelectItem value="archived">{t('archived')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTeamId} onValueChange={setFilterTeamId}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('team')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTeams')}</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                  : format(dateRange.from, "LLL dd, y")
                : t("pickADate", "Pick a date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              aria-label={t('dateRange')}
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" onClick={() => {
          setSearch('');
          setFilterType('all');
          setFilterTeamId('all');
          setDateRange({from: undefined, to: undefined});
        }} className="whitespace-nowrap">
          {t('resetFilters')}
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg border">
          <span>{t('selectedCount', { count: selectedIds.length })}</span>
          <Button variant="destructive" size="sm" onClick={() => setBulkAction('delete')} disabled={bulkLoading}>{t('bulkDelete')}</Button>
          <Button variant="secondary" size="sm" onClick={() => setBulkAction('reassign')} disabled={bulkLoading}>{t('bulkReassign')}</Button>
        </div>
      )}

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : filteredAnnouncements.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{t('noAnnouncements')}</p>
          </div>
        ) : (
          filteredAnnouncements.map(announcement => {
            return (
              <div key={announcement.id} className="relative">
                <input
                  type="checkbox"
                  className="absolute left-2 top-2 z-10"
                  checked={selectedIds.includes(announcement.id)}
                  onChange={() => handleSelectOne(announcement.id)}
                  aria-label={t('selectAnnouncement')}
                />
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  actions={{
                    onView: handleView,
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                    onReassign: handleReassign,
                  }}
                  canEdit={true} // or your actual logic
                />
              </div>
            );
          })
        )}
      </div>
      {/* Modals for View, Edit, Delete, Reassign */}
      {/* View Announcement Modal */}
      <Dialog open={!!viewedAnnouncement} onOpenChange={open => !open && closeViewAnnouncementModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('viewAnnouncement')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="font-bold">{viewedAnnouncement ? getAnnouncementTitle(viewedAnnouncement) : ''}</div>
            <div>{viewedAnnouncement?.content}</div>
            <div className="text-xs text-muted-foreground">
              {t('audience')}: {teams.find(t => t.id === viewedAnnouncement?.teamId)?.name || t('allTeams')}<br />
              {t('sentAt')}: {viewedAnnouncement?.sentAt ? format(parseISO(String(viewedAnnouncement.sentAt)), 'PPP') : t('unknown', 'Unknown')}<br />
              {t('sender')}: {viewedAnnouncement?.senderName || '-'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeViewAnnouncementModal}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <Dialog open={!!editAnnouncementModal} onOpenChange={open => !open && closeEditAnnouncementModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editAnnouncement')}</DialogTitle>
          </DialogHeader>
          {/* Edit form implementation */}
          {editAnnouncementModal && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const { id, content, type, teamId } = editAnnouncementModal;
                const res = await updateAnnouncementAction(id, content, (type === 'mdx' || type === 'plain' ? type : 'plain'), teamId ?? 0);
                if (res.success) {
                  setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, content, type, teamId } : a));
                  toast.success(t('announcementUpdated'));
                  closeEditAnnouncementModal();
                } else {
                  toast.error(res.message || t('updateFailed'));
                }
              }}
            >
              <Label htmlFor="edit-title">{t('title')}</Label>
              <Input
                id="edit-title"
                value={editAnnouncementModal.title ?? ''}
                onChange={e => setEditAnnouncementModal({ ...editAnnouncementModal, title: e.target.value })}
                placeholder={t('title', 'Title')}
                className="w-full"
              />
              <Label htmlFor="edit-content">{t('content')}</Label>
              <Textarea
                id="edit-content"
                value={editAnnouncementModal.content ?? ''}
                onChange={e => setEditAnnouncementModal({ ...editAnnouncementModal, content: e.target.value })}
                placeholder={t('content', 'Content')}
                className="w-full"
              />
              <Label htmlFor="edit-type">{t('type')}</Label>
              <Select
                value={editAnnouncementModal.type ?? 'plain'}
                onValueChange={type => setEditAnnouncementModal({ ...editAnnouncementModal, type })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('type', 'Type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">{t('plain', 'Plain')}</SelectItem>
                  <SelectItem value="mdx">{t('mdx', 'MDX')}</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="edit-team">{t('team')}</Label>
              <Select
                value={String(editAnnouncementModal.teamId ?? 0)}
                onValueChange={val => setEditAnnouncementModal({ ...editAnnouncementModal, teamId: Number(val) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('team', 'Team')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('allTeams', 'All Teams')}</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditAnnouncementModal} type="button">{t('cancel')}</Button>
                <Button type="submit">{t('save')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteAnnouncementModal} onOpenChange={open => !open && closeDeleteAnnouncementModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteAnnouncement')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteAnnouncementModal}>{t('cancel')}</Button>
            <Button variant="destructive" disabled>{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={!!reassignAnnouncementModal} onOpenChange={open => !open && closeReassignAnnouncementModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reassignAnnouncement')}</DialogTitle>
          </DialogHeader>
          {/* Reassign form implementation */}
          {reassignAnnouncementModal && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const { id, content, type, teamId } = reassignAnnouncementModal;
                const res = await reassignAnnouncementAction(id, [teamId ?? 0], teamId ?? 0);
                if (res.success) {
                  setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, teamId } : a));
                  toast.success(t('announcementReassigned'));
                  closeReassignAnnouncementModal();
                } else {
                  toast.error(res.message || t('reassignFailed'));
                }
              }}
            >
              <Label htmlFor="reassign-team">{t('team')}</Label>
              <Select
                value={String(reassignAnnouncementModal.teamId ?? 0)}
                onValueChange={val => setReassignAnnouncementModal({ ...reassignAnnouncementModal, teamId: Number(val) })}
              >
                <SelectTrigger id="reassign-team">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('allTeams')}</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={closeReassignAnnouncementModal} type="button">{t('cancel')}</Button>
                <Button type="submit">{t('save')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkAction === 'delete'} onOpenChange={open => !open && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bulkDelete')}</DialogTitle>
            <DialogDescription>{t('bulkDeleteConfirm', { count: selectedIds.length })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={bulkLoading}>{t('cancel')}</Button>
            <Button
              variant="destructive"
              disabled={bulkLoading}
              onClick={async () => {
                setBulkLoading(true);
                const res = await bulkDeleteAnnouncementsAction(selectedIds);
                setBulkLoading(false);
                if (res.success) {
                  setAnnouncements(prev => prev.filter(a => !selectedIds.includes(a.id)));
                  setSelectedIds([]);
                  toast.success(t('announcementsDeleted'));
                } else {
                  toast.error(res.message || t('deleteFailed'));
                }
                setBulkAction(null);
              }}
            >
              {bulkLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reassign Dialog */}
      <Dialog open={bulkAction === 'reassign'} onOpenChange={open => !open && setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bulkReassign')}</DialogTitle>
          </DialogHeader>
          <Label htmlFor="bulk-reassign-team">{t('team')}</Label>
          <Select
            value={String(bulkReassignTeamId ?? 0)}
            onValueChange={val => setBulkReassignTeamId(Number(val))}
          >
            <SelectTrigger id="bulk-reassign-team">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('allTeams')}</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={bulkLoading}>{t('cancel')}</Button>
            <Button
              disabled={bulkLoading}
              onClick={async () => {
                setBulkLoading(true);
                const res = await bulkReassignAnnouncementsAction(selectedIds, [bulkReassignTeamId]);
                setBulkLoading(false);
                if (res.success) {
                  setAnnouncements(prev => prev.map(a => selectedIds.includes(a.id) ? { ...a, teamId: bulkReassignTeamId } : a));
                  setSelectedIds([]);
                  toast.success(t('announcementsReassigned'));
                } else {
                  toast.error(res.message || t('reassignFailed'));
                }
                setBulkAction(null);
              }}
            >
              {bulkLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
