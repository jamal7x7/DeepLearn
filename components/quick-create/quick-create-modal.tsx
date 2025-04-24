"use client";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";

import { QuickCreateTeamForm } from "./quick-create-team-form";
import { QuickCreateInviteForm } from "./quick-create-invite-form";
import { QuickCreateCourseForm } from "./quick-create-course-form";
import { QuickCreateAnnouncementForm } from "./quick-create-announcement-form";

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated?: () => void;
}

export function QuickCreateModal({ open, onOpenChange, onTeamCreated }: QuickCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-full md:max-w-[55vw] p-0 rounded-lg shadow-xl min-h-[480px] max-h-[90vh] ">

      {/* <DialogContent className="max-w-lg  w-full p-0 rounded-lg shadow-xl min-h-[480px] max-h-[90vh] "> */}
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-lg font-semibold">Quick Create</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4 overflow-y-auto max-h-[65vh]">
          <Tabs defaultValue="team">
            <TabsList className="flex gap-2 mb-4">
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="invite">Invitation Code</TabsTrigger>
              <TabsTrigger value="course">Course</TabsTrigger>
              <TabsTrigger value="announcement">Announcement</TabsTrigger>
            </TabsList>
            <TabsContent value="team">
              <QuickCreateTeamForm onSuccess={onTeamCreated} />
            </TabsContent>
            <TabsContent value="invite">
              <QuickCreateInviteForm />
            </TabsContent>
            <TabsContent value="course">
              <QuickCreateCourseForm />
            </TabsContent>
            <TabsContent value="announcement">
              <QuickCreateAnnouncementForm />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
