"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw, Filter, Send, Plus, Loader2, ListChecks, Clock, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementCard, AnnouncementCardProps } from "@/components/AnnouncementCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

// --- Announcement type with senderName for search ---
type Announcement = AnnouncementCardProps & {
  teamId: number;
  sentAt?: string;
  senderName?: string; // Add senderName for search compatibility
};

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
    type: 'info'
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
        'plain' // Defaulting type to 'plain'
      );

      if (result.success) {
        toast.success(t('success.announcementSent'));
        // Close dialog and reset form
        setDialogOpen(false);
        setNewAnnouncement({
          content: '',
          targetTeamId: 'all',
          type: 'info'
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
    setEditForm({ content: a.content ?? '', type: a.type ?? 'info', teamId: a.teamId });
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
    setReassignTeams([a.teamId]);
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
      editForm.type,
      editForm.teamId
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
    const res = await reassignAnnouncementAction(reassignAnnouncement.id, reassignTeams, teamId);
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

  // --- Filtered announcements with advanced search ---
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = (a.content ?? '').toLowerCase().includes(searchDebounced.toLowerCase());
    const matchesTeam = filterTeamId === 'all' || String(a.teamId) === filterTeamId;
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesSender = !searchSender || (a.senderName ? a.senderName.toLowerCase() : '').includes(searchSender.toLowerCase());
    const sentDate = a.sentAt ? parseISO(a.sentAt) : new Date();
    const matchesDate = !dateRange.from || !dateRange.to || isWithinInterval(sentDate, { start: dateRange.from, end: dateRange.to });
    return matchesSearch && matchesTeam && matchesType && matchesSender && matchesDate;
  });

  // --- RENDER TREE ---
  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Tabs value="announcements" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="announcements">{t('announcements', 'Announcements')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics', 'Analytics')}</TabsTrigger>
        </TabsList>

        {/* --- Announcements Tab --- */}
        <TabsContent value="announcements">
          {/* Create Announcement Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('createAnnouncement', 'Create Announcement')}</CardTitle>
              <CardDescription>{t('createAnnouncementDesc', 'Post a new announcement and assign visibility.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-4">
                <Textarea
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement(a => ({ ...a, content: e.target.value }))}
                  placeholder={t('announcementContent', 'Announcement content...')}
                  minLength={2}
                  required
                />
                <div className="flex gap-4">
                  <Select
                    value={newAnnouncement.targetTeamId}
                    onValueChange={val => setNewAnnouncement(a => ({ ...a, targetTeamId: val }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('selectTeam', 'Select team')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTeams', 'All Teams')}</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newAnnouncement.type}
                    onValueChange={val => setNewAnnouncement(a => ({ ...a, type: val }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('type', 'Type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{t('info', 'Info')}</SelectItem>
                      <SelectItem value="warning">{t('warning', 'Warning')}</SelectItem>
                      <SelectItem value="urgent">{t('urgent', 'Urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-fit">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} 
                  {t('postAnnouncement', 'Post Announcement')}
                </Button>
              </form>
            </CardContent>
          </Card>
          {/* Announcements List Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('announcementsList', 'Announcements')}</CardTitle>
              <CardDescription>{t('announcementsListDesc', 'View, edit, delete, or reassign announcements.')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* FILTERS & BULK ACTIONS */}
              <div className="flex flex-wrap gap-4 mb-4 items-center">
                <Input
                  className="w-64"
                  placeholder={t('searchAnnouncements', 'Search announcements...')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <Input
                  className="w-48"
                  placeholder={t('searchSender', 'Search sender...')}
                  value={searchSender}
                  onChange={e => setSearchSender(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('dateRange', 'Date range')}:</span>
                  <Calendar
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    mode="range"
                    className="rounded-md border shadow-sm"
                  />
                  {dateRange.from && dateRange.to && (
                    <Button size="sm" variant="ghost" onClick={() => setDateRange({ from: undefined, to: undefined })}>{t('clear', 'Clear')}</Button>
                  )}
                </div>
                <Button variant="destructive" size="sm" disabled={selectedIds.length === 0 || bulkDeleteLoading} onClick={handleBulkDelete}>
                  {bulkDeleteLoading ? t('deleting', 'Deleting...') : <><Trash2 className="h-4 w-4 mr-2" />{t('bulkDelete', 'Delete Selected')}</>}
                </Button>
                <Button variant="secondary" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkReassign}>
                  <ListChecks className="h-4 w-4 mr-2" />
                  {t('bulkReassign', 'Reassign Selected')}
                </Button>
              </div>
              {/* Table/List of Announcements */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr>
                      <th className="px-4 py-2 text-left">{t('content', 'Content')}</th>
                      <th className="px-4 py-2 text-left">{t('type', 'Type')}</th>
                      <th className="px-4 py-2 text-left">{t('teams', 'Teams')}</th>
                      <th className="px-4 py-2 text-left">{t('date', 'Date')}</th>
                      <th className="px-4 py-2 text-left">{t('actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skeleton-row-${i}`}>
                          <td colSpan={5}><Skeleton className="h-8 w-full" /></td>
                        </tr>
                      ))
                    ) : filteredAnnouncements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <span role="img" aria-label="No data" className="text-4xl">📭</span>
                            <span>{t('noAnnouncementsFound', 'No announcements found.')}</span>
                            <Button onClick={() => setEditModalOpen(true)}>{t('createAnnouncement', 'Create Announcement')}</Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAnnouncements.map(a => (
                        <tr key={`announcement-${a.id}`} className="border-b border-muted">
                          <td className="px-4 py-2 max-w-xs truncate">{a.content}</td>
                          <td className="px-4 py-2">{a.type}</td>
                          <td className="px-4 py-2">{a.teamId === 0 ? t('allTeams', 'All Teams') : teams.find(t => t.id === a.teamId)?.name}</td>
                          <td className="px-4 py-2">{a.sentAt ? new Date(a.sentAt).toLocaleString() : ''}</td>
                          <td className="px-4 py-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditModal(a)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(a.id)}><Trash2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="secondary" onClick={() => openReassignModal(a)}><ListChecks className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" disabled={selectedIds.length === 0 || bulkDeleteLoading} onClick={handleBulkDelete}>
                  {bulkDeleteLoading ? t('deleting', 'Deleting...') : <><Trash2 className="h-4 w-4 mr-2" />{t('bulkDelete', 'Delete Selected')}</>}
                </Button>
                <Button variant="secondary" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkReassign}>
                  <ListChecks className="h-4 w-4 mr-2" />
                  {t('bulkReassign', 'Reassign Selected')}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Analytics Tab --- */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader><CardTitle>{t('totalAnnouncements', 'Total Announcements')}</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.totalAnnouncements}</span></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('unreadAnnouncements', 'Unread Announcements')}</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.unreadAnnouncements}</span></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('announcementsToday', 'Today')}</CardTitle></CardHeader>
              <CardContent><span className="text-2xl font-bold">{stats.announcementsToday}</span></CardContent>
            </Card>
          </div>
          {/* Placeholder for chart/analytics visualization */}
          <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">{t('analyticsComingSoon', 'Analytics chart coming soon...')}</div>
        </TabsContent>

        {/* --- Modals and Dialogs --- */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editAnnouncement', 'Edit Announcement')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <Textarea
                value={editForm.content}
                onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                required
              />
              <Select
                value={editForm.type}
                onValueChange={val => setEditForm(f => ({ ...f, type: val }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('type', 'Type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{t('info', 'Info')}</SelectItem>
                  <SelectItem value="warning">{t('warning', 'Warning')}</SelectItem>
                  <SelectItem value="urgent">{t('urgent', 'Urgent')}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(editForm.teamId)}
                onValueChange={val => setEditForm(f => ({ ...f, teamId: Number(val) }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('selectTeam', 'Select team')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('allTeams', 'All Teams')}</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditModal}>{t('cancel', 'Cancel')}</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? t('saving', 'Saving...') : t('save', 'Save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('deleteAnnouncement', 'Delete Announcement')}</DialogTitle>
              <DialogDescription>{t('deleteConfirm', 'Are you sure you want to delete this announcement?')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDeleteDialog}>{t('cancel', 'Cancel')}</Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>{deleteLoading ? t('deleting', 'Deleting...') : t('delete', 'Delete')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reassignVisibility', 'Reassign Visibility')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReassignSubmit} className="flex flex-col gap-4">
              <Label>{t('selectTeams', 'Select teams')}</Label>
              <div className="relative">
                <Command className="rounded-md border">
                  <CommandInput placeholder={t('searchTeams', 'Search teams...')} />
                  <CommandList>
                    <CommandEmpty>{t('noTeamsFound', 'No teams found')}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        onSelect={() => {
                          setReassignTeams(teams => teams.includes(0) ? teams.filter(id => id !== 0) : [0]);
                        }}
                        className={reassignTeams.includes(0) ? 'bg-accent' : ''}
                      >
                        {t('allTeams', 'All Teams')}
                      </CommandItem>
                      {teams.map(team => (
                        <CommandItem
                          key={team.id}
                          onSelect={() => {
                            setReassignTeams(teams => {
                              if (teams.includes(team.id)) return teams.filter(id => id !== team.id);
                              return [...teams.filter(id => id !== 0), team.id];
                            });
                          }}
                          className={reassignTeams.includes(team.id) ? 'bg-accent' : ''}
                        >
                          {team.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="flex flex-wrap gap-2 mt-2">
                  {reassignTeams.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                      {id === 0 ? t('allTeams', 'All Teams') : teams.find(t => t.id === id)?.name}
                      <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => setReassignTeams(ts => ts.filter(tid => tid !== id))}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeReassignModal}>{t('cancel', 'Cancel')}</Button>
                <Button type="submit" disabled={reassignLoading}>{reassignLoading ? t('saving', 'Saving...') : t('save', 'Save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={bulkReassignModalOpen} onOpenChange={setBulkReassignModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('bulkReassign', 'Reassign Selected')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBulkReassignSubmit} className="flex flex-col gap-4">
              <Label>{t('selectTeams', 'Select teams')}</Label>
              <div className="relative">
                <Command className="rounded-md border">
                  <CommandInput placeholder={t('searchTeams', 'Search teams...')} />
                  <CommandList>
                    <CommandEmpty>{t('noTeamsFound', 'No teams found')}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        onSelect={() => {
                          setBulkReassignTeams(teams => teams.includes(0) ? teams.filter(id => id !== 0) : [0]);
                        }}
                        className={bulkReassignTeams.includes(0) ? 'bg-accent' : ''}
                      >
                        {t('allTeams', 'All Teams')}
                      </CommandItem>
                      {teams.map(team => (
                        <CommandItem
                          key={team.id}
                          onSelect={() => {
                            setBulkReassignTeams(teams => {
                              if (teams.includes(team.id)) return teams.filter(id => id !== team.id);
                              return [...teams.filter(id => id !== 0), team.id];
                            });
                          }}
                          className={bulkReassignTeams.includes(team.id) ? 'bg-accent' : ''}
                        >
                          {team.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bulkReassignTeams.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                      {id === 0 ? t('allTeams', 'All Teams') : teams.find(t => t.id === id)?.name}
                      <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => setBulkReassignTeams(ts => ts.filter(tid => tid !== id))}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBulkReassignModalOpen(false)}>{t('cancel', 'Cancel')}</Button>
                <Button type="submit" disabled={bulkReassignLoading}>{bulkReassignLoading ? t('saving', 'Saving...') : t('save', 'Save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
}
