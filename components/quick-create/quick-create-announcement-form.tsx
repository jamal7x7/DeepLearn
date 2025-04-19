"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { sendAnnouncementAction } from "@/app/actions/announcement";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../ui/select";

import { useUserTeams } from "./use-user-teams";


const announcementSchema = z.object({
  content: z.string().min(2, "Announcement content must be at least 2 characters"),
  teamId: z.string().min(1, "Please select a team"),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export function QuickCreateAnnouncementForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
  });
  const { teams, isLoading: isTeamsLoading, hasError } = useUserTeams();

  async function onSubmit(data: AnnouncementFormValues) {
    try {
      const teamId = parseInt(data.teamId, 10);
      const result = await sendAnnouncementAction(data.content, [teamId], "plain");
      if (result.success) {
        reset();
        onSuccess?.();
        router.refresh();
      } else {
        alert(result.message || "Failed to create announcement.");
      }
    } catch (error) {
      alert("Unexpected error creating announcement.");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block mb-1 font-medium">Announcement</label>
        <Textarea {...register("content")}
          placeholder="e.g. School will be closed tomorrow."
          className="w-full min-h-[80px]" />
        {errors.content && <span className="text-red-500 text-xs">{errors.content.message}</span>}
      </div>
      <div>
        <label className="block mb-1 font-medium">Team</label>
        <Select
          value={watch("teamId")}
          onValueChange={(value) => setValue("teamId", value, { shouldValidate: true })}
          disabled={isTeamsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a team" />
          </SelectTrigger>
          <SelectContent>
            {/* Remove SelectItem with empty value, only show actual teams */}
            {teams.map((team) => (
              <SelectItem key={team.id} value={String(team.id)}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teamId && <span className="text-red-500 text-xs">{errors.teamId.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting || isTeamsLoading} className="mt-2">Create Announcement</Button>
    </form>
  );
}
