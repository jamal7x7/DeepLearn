"use client";

import { Mail, Trash2, Star, Shield, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Jdenticon from "react-jdenticon";
import React from "react";

function getRoleIcon(role: string) {
  if (role === "teacher") return <Star className="h-4 w-4 text-yellow-500 mr-1" />;
  if (role === "admin") return <Shield className="h-4 w-4 text-blue-500 mr-1" />;
  return null;
}

export interface TeamMemberCardProps {
  member: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  teamId: number;
  canDelete: boolean;
  variant?: "teacher" | "staff" | "student";
  showDelete?: boolean;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  teamId,
  canDelete,
  variant = "student",
  showDelete = false,
}) => {
  const avatarSize = variant === "teacher" ? 48 : variant === "staff" ? 40 : 32;
  return (
    <Card
      className={
        variant === "teacher"
          ? "flex flex-col transition-shadow hover:shadow-2xl group border-2 border-yellow-400 bg-card text-card-foreground"
          : variant === "staff"
          ? "flex flex-col transition-shadow hover:shadow-xl group bg-card text-card-foreground"
          : "flex flex-row items-center gap-3 px-3 py-2 min-h-0 rounded-lg bg-card text-card-foreground border transition-shadow hover:shadow-md group"
      }
      style={variant === "student" ? { minHeight: "0", height: "auto" } : undefined}
    >
      {variant === "student" ? (
        <CardContent className="flex flex-row items-center gap-3 p-0 w-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="rounded-lg">
              <Jdenticon
                size={avatarSize}
                value={String(member.id || member.email || member.name || "user")}
                title={member.name || member.email || "User"}
                style={{ borderRadius: "9999px", width: "100%", height: "100%" }}
              />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{member.name || "No Name"}</div>
            <div className="text-xs text-muted-foreground truncate">{member.email}</div>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">{member.role}</Badge>
          {canDelete && showDelete && (
            <div className="ml-2 flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    type="button"
                    aria-label="Open menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild variant="destructive">
                    <button type="submit" className="flex items-center gap-2 w-full">
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      ) : (
        <>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className={variant === "teacher" ? "h-12 w-12" : "h-10 w-10"}>
              <AvatarFallback className="rounded-lg">
                <Jdenticon
                  size={avatarSize}
                  value={String(member.id || member.email || member.name || "user")}
                  title={member.name || member.email || "User"}
                  style={{ borderRadius: "9999px", width: "100%", height: "100%" }}
                />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className={variant === "teacher" ? "text-lg flex items-center gap-1" : "text-base flex items-center gap-1"}>
                {getRoleIcon(member.role)}
                {member.name || "No Name"}
              </CardTitle>
              <div className="text-xs text-muted-foreground">{member.email}</div>
              <Badge
                className="mt-1"
                variant={member.role === "admin" ? "destructive" : "secondary"}
              >
                {member.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1"></CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              type="button"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            {canDelete && showDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="flex items-center gap-1"
                type="submit"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default TeamMemberCard;