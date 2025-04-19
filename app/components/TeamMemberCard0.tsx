"use client";

import { Mail, Trash2, Star, Shield } from "lucide-react";
import Jdenticon from "react-jdenticon";
import React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onRemove: (userId: number) => void;
  variant?: "teacher" | "staff" | "student";
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  teamId,
  canDelete,
  onRemove,
  variant = "student",
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
        <CardContent className="flex flex-row items-center gap-3 p-0">
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
          <div className="flex-1">
            <div className="font-medium text-sm">{member.name || "No Name"}</div>
            <div className="text-xs text-muted-foreground">{member.email}</div>
          </div>
          <Badge variant="secondary" className="ml-2">{member.role}</Badge>
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  type="button"
                  onClick={() => onRemove(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove student</TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  type="button"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send email</TooltipContent>
            </Tooltip>
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-1"
                    type="button"
                    onClick={() => onRemove(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove member</TooltipContent>
              </Tooltip>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};