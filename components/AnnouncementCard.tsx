"use client";

import { Pencil, Download as DownloadIcon, ListChecks } from "lucide-react";
import Jdenticon from "react-jdenticon";
import React from "react";
import { useTranslation } from "react-i18next";
import cn from "classnames";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AnnouncementMdxStaticPreview from "@/components/AnnouncementMdxStaticPreview";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// AnnouncementCardProps: Props for a single announcement card
export interface AnnouncementCardProps {
  id: number;
  title: string;
  content: string;
  type?: string;
  sender: string;
  email?: string;
  sentAt?: string;
  teamId?: number;
  schedule?: string;
  notifiedAt?: string;
  importance?: string;
  senderName?: string;
  teamName?: string;
}

export interface AnnouncementCardActionHandlers {
  onView: (announcement: AnnouncementCardProps) => void;
  onEdit: (announcement: AnnouncementCardProps) => void;
  onDelete: (announcement: AnnouncementCardProps) => void;
  onReassign: (announcement: AnnouncementCardProps) => void;
}

export const AnnouncementCard: React.FC<{
  announcement: AnnouncementCardProps;
  canEdit?: boolean;
  actions?: AnnouncementCardActionHandlers;
}> = ({
  announcement,
  canEdit = true,
  actions,
}) => {
  const { t, i18n } = useTranslation();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editValue, setEditValue] = React.useState(announcement.content || "");
  const [saving, setSaving] = React.useState(false);

  // Utility: Determine sender role for badge/accent
  const getRole = () => {
    if (announcement.sender.toLowerCase().includes('admin')) return 'admin';
    // Only show 'Me' if this is the current teacher's own announcement (not another teacher)
    if (canEdit && announcement.email && typeof window !== 'undefined') {
      const userEmail = window.localStorage.getItem('userEmail');
      if (userEmail && announcement.email === userEmail) return 'self';
    }
    return 'teacher';
  };
  const role = getRole();
  const roleColor = role === 'admin' ? 'bg-red-500 text-white' : role === 'self' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white';
  const roleLabel = role === 'admin' ? t('admin', 'Admin') : role === 'self' ? t('me', 'Me') : t('teacher', 'Teacher');

  // Download MDX as .md file
  const handleDownload = () => {
    const blob = new Blob([announcement.content || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `announcement-${announcement.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save edited MDX
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/team/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: announcement.id,
          content: editValue,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update announcement");
      }
      announcement.content = editValue;
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
    setEditOpen(false);
  };

  return (
    <Card
      key={announcement.id}
      className={
        cn(
          'group bg-card/90 hover:bg-accent/60 transition-colors border shadow-md hover:shadow-lg rounded-lg overflow-hidden',
          role === 'admin' ? 'border-red-400/60' : role === 'self' ? 'border-blue-400/60' : 'border-green-400/40'
        )
      }
    >
      <CardHeader className="py-3 flex flex-row items-center gap-3 border-b border-muted/30 bg-muted/10">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="rounded-lg">
            <Jdenticon size={24} value={announcement.email || announcement.sender || 'unknown'} />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-foreground truncate max-w-[120px]">{announcement.sender}</span>
            <Badge className={cn('text-xs px-2 py-0.5', roleColor)}>{roleLabel}</Badge>
            <Badge variant="outline" className="ml-2 font-normal text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/20">
              {announcement.teamName}
            </Badge>
          </div>
          <time dateTime={announcement.sentAt ?? ''} className="text-xs text-muted-foreground font-normal">
            {announcement.sentAt ? new Date(announcement.sentAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' }) : t('unknown', 'Unknown')}
          </time>
        </div>
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('actions', 'Actions')}>
                <ListChecks className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions?.onView?.(announcement)}>
                {t('view', 'View')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions?.onEdit?.(announcement)}>
                {t('edit', 'Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions?.onDelete?.(announcement)}>
                {t('delete', 'Delete')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => actions?.onReassign?.(announcement)}>
                {t('reassign', 'Reassign')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Only show edit/download for self (logged-in teacher, never for admin) */}
          {role === 'self' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="transition-colors hover:bg-accent-foreground/10 hover:text-primary text-accent-foreground/70"
                aria-label={t('edit', 'Edit')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {announcement.type === 'mdx' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="transition-colors hover:bg-accent-foreground/10 hover:text-primary text-accent-foreground/70"
                  aria-label={t('download', 'Download')}
                >
                  <DownloadIcon className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-3">
        <div className="mb-1">
          <div className="bg-muted/70 rounded-xl px-3 py-2 relative min-h-[56px]">
            {announcement.type === 'mdx' ? (
              <AnnouncementMdxStaticPreview value={announcement.content || ''} />
            ) : (
              <span className="text-base font-medium text-foreground leading-snug break-words line-clamp-3">
                {announcement.content || ''}
              </span>
            )}
          </div>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('editAnnouncement', 'Edit Announcement')}</DialogTitle>
            </DialogHeader>
            <textarea
              className="w-full border rounded p-2 min-h-[180px] font-mono"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              disabled={saving}
              autoFocus
            />
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t('saving', 'Saving...') : t('save', 'Save')}
              </Button>
              <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                {t('cancel', 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};