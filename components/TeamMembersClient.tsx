"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, ArrowLeft, Star, Shield, MoreVertical, Trash2, Send, Loader2 } from "lucide-react";
import TeamMemberCard from "@/components/TeamMemberCard";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { removeTeam } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendAnnouncementAction } from "@/app/actions/announcement";
import TeamAnnouncementHistory from "@/components/TeamAnnouncementHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementMdxPreview from "@/components/AnnouncementMdxPreview";

// --- AnnouncementForm component ---
function TeamAnnouncementForm({ teamId, onAnnouncementSent }: { teamId: number; onAnnouncementSent?: () => void }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [announcementType, setAnnouncementType] = useState<"plain" | "mdx">("plain");
  const { t, i18n } = useTranslation();

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t("pleaseEnterMessage"));
      return;
    }
    setIsSending(true);
    const result = await sendAnnouncementAction(message, [teamId], announcementType);
    setIsSending(false);
    if (result.success) {
      toast.success(t("announcementSent"));
      setMessage("");
      // Trigger refresh of announcement history
      if (onAnnouncementSent) {
        onAnnouncementSent();
      }
    } else {
      toast.error(result.message || t("failedToSendAnnouncement"));
    }
  };

  return (
    <Card className="mt-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t("teamAnnouncements")}</CardTitle>
        <CardDescription>{t("sendMessagesToAllMembers")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid w-full gap-1.5">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name={`announcementType-${teamId}`}
                value="plain"
                checked={announcementType === "plain"}
                onChange={() => setAnnouncementType("plain")}
                disabled={isSending}
              />
              Plain Text
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name={`announcementType-${teamId}`}
                value="mdx"
                checked={announcementType === "mdx"}
                onChange={() => setAnnouncementType("mdx")}
                disabled={isSending}
              />
              MDX
            </label>
          </div>
          <Label htmlFor={`announcement-${teamId}`}>{t("newMessage")}</Label>
          <Textarea
            id={`announcement-${teamId}`}
            placeholder={t("typeAnnouncementHere")}
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isSending}
            rows={4}
          />
          <AnnouncementMdxPreview value={message} />
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="mt-2"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t("sendAnnouncement")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
// --- AnnouncementForm component ---

export interface TeamData {
  teamId: number;
  teamName: string;
  userRole: string;
  members: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  }[];
}

function dedupeMembers(members: TeamData["members"]) {
  const seen = new Set<number>();
  return members.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export default function TeamMembersClient({ teams: initialTeams }: { teams: TeamData[] }) {
  const [teams, setTeams] = useState<TeamData[]>(initialTeams);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const { t , i18n} = useTranslation();

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId);

  function canDeleteTeam(role: string) {
    return ["teacher", "admin", "dev"].includes(role);
  }

  async function handleDeleteTeam(teamId: number) {
    if (window.confirm(t("deleteTeamConfirm"))) {
      await removeTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
      setSelectedTeamId(null);
    }
  }

  return (
    <div>
      {!selectedTeamId ? (
        <div>
          <h2 className="text-xl font-bold mb-4">{t("yourTeams")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {teams.map((team) => (
              <div key={team.teamId} className="relative group">
                <button
                  className={cn(
                    "group relative rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-xl transition-all p-6 pb-12 flex flex-col items-start cursor-pointer outline-none focus:ring-2 focus:ring-primary w-full",
                    "hover:bg-primary/5 dark:hover:bg-primary/10"
                  )}
                  onClick={() => setSelectedTeamId(team.teamId)}
                  aria-label={t("viewMembersOf", { team: team.teamName })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">{team.teamName}</span>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {t("membersCount", { count: team.members.length })}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {dedupeMembers(team.members).slice(0, 3).map((m) => (
                      <span
                        key={`${m.id}-${team.teamId}`}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground",
                          m.role === "teacher" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          m.role === "admin" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        )}
                      >
                        {m.name || m.email}
                      </span>
                    ))}
                    {team.members.length > 3 && (
                      <span className="text-xs text-muted-foreground">{t("moreMembers", { count: team.members.length - 3 })}</span>
                    )}
                  </div>
                  <span className="absolute right-4 bottom-4 text-xs text-muted-foreground group-hover:text-primary transition">
                    {t("viewMembersArrow")}
                  </span>
                </button>
                {canDeleteTeam(team.userRole) && (
                  <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground"
                          type="button"
                          aria-label={t("openTeamMenu")}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          asChild
                          variant="destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDeleteTeam(team.teamId);
                          }}
                        >
                          <button type="button" className="flex items-center gap-2 w-full">
                            <Trash2 className="h-4 w-4" />
                            {t("deleteTeam")}
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 flex items-center gap-2 text-primary hover:underline"
            onClick={() => setSelectedTeamId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToTeams")}
          </button>
          <TooltipProvider>
            <div className="rounded-2xl border bg-card text-card-foreground shadow-lg p-6 mb-10">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-primary">{selectedTeam?.teamName}</h2>
                <Badge variant="outline" className="ml-2">{t("membersCount", { count: selectedTeam?.members.length ?? 0 })}</Badge>
              </div>
              <Tabs defaultValue="members" className="w-full">
                <TabsList>
                  <TabsTrigger value="members">{t("teamMembersTab")}</TabsTrigger>
                  <TabsTrigger value="announcements">{t("announcementsTab")}</TabsTrigger>
                </TabsList>
                <TabsContent value="members">
                  {selectedTeam && (
                    <>
                      {/* Teachers */}
                      {dedupeMembers(selectedTeam.members).filter((m) => m.role === "teacher").length > 0 && (
                        <>
                          <div className="mb-1 text-sm font-semibold text-primary flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {t("teacher")}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {dedupeMembers(selectedTeam.members)
                              .filter((m) => m.role === "teacher")
                              .map((member) => (
                                <TeamMemberCard
                                  key={`${member.id}-${selectedTeam.teamId}`}
                                  member={member}
                                  teamId={selectedTeam.teamId}
                                  canDelete={["teacher", "admin", "dev"].includes(selectedTeam.userRole)}
                                  variant="teacher"
                                  showDelete
                                />
                              ))}
                          </div>
                        </>
                      )}
                      {/* Staff */}
                      {dedupeMembers(selectedTeam.members).filter((m) => m.role !== "teacher" && m.role !== "student").length > 0 && (
                        <>
                          <div className="mb-1 text-sm font-semibold text-primary flex items-center gap-1">
                            <Shield className="h-4 w-4 text-blue-500" />
                            {t("staff")}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {dedupeMembers(selectedTeam.members)
                              .filter((m) => m.role !== "teacher" && m.role !== "student")
                              .map((member) => (
                                <TeamMemberCard
                                  key={`${member.id}-${selectedTeam.teamId}`}
                                  member={member}
                                  teamId={selectedTeam.teamId}
                                  canDelete={["teacher", "admin", "dev"].includes(selectedTeam.userRole)}
                                  variant="staff"
                                  showDelete
                                />
                              ))}
                          </div>
                        </>
                      )}
                      {/* Students */}
                      {dedupeMembers(selectedTeam.members).filter((m) => m.role === "student").length > 0 && (
                        <>
                          <div className="mb-1 text-sm font-semibold text-primary">{t("students")}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {dedupeMembers(selectedTeam.members)
                              .filter((m) => m.role === "student")
                              .map((member) => (
                                <TeamMemberCard
                                  key={`${member.id}-${selectedTeam.teamId}`}
                                  member={member}
                                  teamId={selectedTeam.teamId}
                                  canDelete={["teacher", "admin", "dev"].includes(selectedTeam.userRole)}
                                  variant="student"
                                  showDelete
                                />
                              ))}
                          </div>
                        </>
                      )}
                      {dedupeMembers(selectedTeam.members).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mb-2" />
                          <div>{t("noMembersInTeamYet")}</div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                <TabsContent value="announcements">
                  {selectedTeam && ["teacher", "admin", "dev"].includes(selectedTeam.userRole) && (
                    <>
                      <TeamAnnouncementForm
                        teamId={selectedTeam.teamId}
                        onAnnouncementSent={() => setRefreshTrigger(prev => prev + 1)}
                      />
                    </>
                  )}
                  {selectedTeam && (
                    <Card className="mt-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                      <CardHeader>
                        <CardTitle>{t("teamAnnouncements")}</CardTitle>
                        <CardDescription>{t("viewAllAnnouncementsForTeam")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TeamAnnouncementHistory
                          teamId={selectedTeam.teamId}
                          refreshTrigger={refreshTrigger}
                        />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}