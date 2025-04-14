"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Pencil, Download as DownloadIcon } from "lucide-react";
import Jdenticon from "react-jdenticon";
import React from "react";
import AnnouncementMdxStaticPreview from "@/components/AnnouncementMdxStaticPreview";
import { useTranslation } from "react-i18next";

export type AnnouncementCardProps = {
  id: number;
  teamName: string;
  content?: string;
  message?: string;
  sentAt: string;
  sender: string;
  email?: string;
  type: "plain" | "mdx";
};

export const AnnouncementCard: React.FC<{ announcement: AnnouncementCardProps; canEdit?: boolean }> = ({
  announcement,
  canEdit = true,
}) => {
  const { t, i18n } = useTranslation();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editValue, setEditValue] = React.useState(announcement.content || "");
  const [saving, setSaving] = React.useState(false);

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
      className="bg-card/90 hover:bg-accent/60 transition-colors border border-primary/20 shadow-md hover:shadow-lg rounded-lg"
    >
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Bell className="h-4 w-4 text-primary" />
            <Badge variant="outline" className="font-normal text-xs px-2 py-0.5">
              {announcement.teamName}
            </Badge>
          </div>
          <time
            dateTime={announcement.sentAt}
            className="text-xs text-muted-foreground font-normal"
          >
            {new Date(announcement.sentAt).toLocaleString()}
          </time>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="mb-1">
          <div className="bg-muted/70 rounded-xl px-3 py-2 relative">
            {announcement.type === "mdx" ? (
              <>
                <AnnouncementMdxStaticPreview value={announcement.content || announcement.message || ""} />
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditOpen(true)}
                      className=" p-2  transition-colors hover:bg-accent-foreground/10 hover:text-primary text-accent-foreground/70"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4 " />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className=" p-2  transition-colors hover:bg-accent-foreground/10 hover:text-primary text-accent-foreground/70"
                    aria-label="Download"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit MDX Announcement</DialogTitle>
                    </DialogHeader>
                    <textarea
                      className="w-full border rounded p-2 min-h-[180px] font-mono"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      disabled={saving}
                      autoFocus
                    />
                    <DialogFooter>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditOpen(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <span className="text-base font-medium text-foreground leading-snug break-words">
                {announcement.content || announcement.message}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <div
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
            className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full shadow-sm border border-muted-foreground/10"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="rounded-lg">
                <Jdenticon
                  size={16}
                  value={announcement.email || announcement.sender || "unknown"}
                />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium">
              {t("from")}: {announcement.sender || t("teacher")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};