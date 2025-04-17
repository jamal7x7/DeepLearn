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
import cn from "classnames";

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
        cn(
          "flex flex-row items-center gap-3 px-3 py-2 min-h-0 rounded-lg bg-card text-card-foreground border transition-shadow hover:shadow-lg group",
          variant === "teacher" && "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
          variant === "staff" && "bg-muted border-muted-foreground/10",
        )
      }
      style={{ minHeight: 0, height: "auto" }}
    >
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
          <div className="font-medium text-sm truncate flex items-center gap-1">
            {getRoleIcon(member.role)}
            {member.name || "No Name"}
          </div>
          <div className="text-xs text-muted-foreground truncate">{member.email}</div>
        </div>
        <Badge variant={member.role === "teacher" ? "destructive" : member.role === "admin" ? "outline" : "secondary"} className="ml-2 shrink-0 capitalize">
          {member.role}
        </Badge>
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
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;