"use client";

import { useState } from "react";
import { Users, ArrowLeft, Star, Shield, MoreVertical, Trash2 } from "lucide-react";
import TeamMemberCard from "@/components/TeamMemberCard";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { removeTeam } from "@/app/actions/team";
import { Button } from "@/components/ui/button";

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

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId);

  function canDeleteTeam(role: string) {
    return ["teacher", "admin", "dev"].includes(role);
  }

  async function handleDeleteTeam(teamId: number) {
    if (window.confirm("Are you sure you want to delete this team? This cannot be undone.")) {
      await removeTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.teamId !== teamId));
      setSelectedTeamId(null);
    }
  }

  return (
    <div>
      {!selectedTeamId ? (
        <div>
          <h2 className="text-xl font-bold mb-4">Your Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {teams.map((team) => (
              <div key={team.teamId} className="relative group">
                <button
                  className={cn(
                    "group relative rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-xl transition-all p-6 flex flex-col items-start cursor-pointer outline-none focus:ring-2 focus:ring-primary w-full",
                    "hover:bg-primary/5 dark:hover:bg-primary/10"
                  )}
                  onClick={() => setSelectedTeamId(team.teamId)}
                  aria-label={`View members of ${team.teamName}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">{team.teamName}</span>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
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
                      <span className="text-xs text-muted-foreground">+{team.members.length - 3} more</span>
                    )}
                  </div>
                  <span className="absolute right-4 top-4 text-xs text-muted-foreground group-hover:text-primary transition">
                    View members &rarr;
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
                          aria-label="Open team menu"
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
                            Delete Team
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
            Back to teams
          </button>
          <TooltipProvider>
            <div className="rounded-2xl border bg-card text-card-foreground shadow-lg p-6 mb-10">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-primary">{selectedTeam?.teamName}</h2>
                <Badge variant="outline" className="ml-2">{selectedTeam?.members.length} members</Badge>
              </div>
              {/* Members */}
              {selectedTeam && (
                <>
                  {/* Teachers */}
                  {dedupeMembers(selectedTeam.members).filter((m) => m.role === "teacher").length > 0 && (
                    <>
                      <div className="mb-1 text-sm font-semibold text-primary flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Teacher
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
                        Staff
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
                      <div className="mb-1 text-sm font-semibold text-primary">Students</div>
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
                      <div>No members in this team yet.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}