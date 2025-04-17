"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, GraduationCap, Users2, BookOpen, Sparkles } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  type: z.enum(["class", "club", "study group", "other"]),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const TEAM_TYPE_OPTIONS = [
  { value: "class", label: "Class", icon: <GraduationCap className="w-5 h-5 text-blue-500" aria-label="Class" /> },
  { value: "club", label: "Club", icon: <Users2 className="w-5 h-5 text-green-500" aria-label="Club" /> },
  { value: "study group", label: "Study Group", icon: <BookOpen className="w-5 h-5 text-purple-500" aria-label="Study Group" /> },
  { value: "other", label: "Other", icon: <Sparkles className="w-5 h-5 text-yellow-500" aria-label="Other" /> },
];

export function QuickCreateTeamForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { type: "class" },
  });
  const selectedType = watch("type");
  const [optimisticTeams, setOptimisticTeams] = React.useState<TeamFormValues[]>([]);

  async function onSubmit(data: TeamFormValues) {
    // Optimistic UI: add to local list immediately
    setOptimisticTeams((prev) => [...prev, data]);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        reset();
        setOptimisticTeams((prev) => prev.filter((t) => t.name !== data.name));
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
        toast.success("Team created");
      } else {
        setOptimisticTeams((prev) => prev.filter((t) => t.name !== data.name));
        toast.error(json.error || "Failed to create team");
      }
    } catch (error) {
      setOptimisticTeams((prev) => prev.filter((t) => t.name !== data.name));
      toast.error("Unexpected error creating team");
    }
  }

  // Fix: Ensure setValue uses the correct type
  const setTeamType = (type: "class" | "club" | "study group" | "other") => setValue("type", type);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="team-name" className="block mb-1 font-medium">Team Name</label>
        <Input id="team-name" {...register("name")}
          placeholder="e.g. Math Club"
          className="w-full" />
        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
      </div>
      <div>
        <label htmlFor="team-type" className="block mb-1 font-medium">Type</label>
        <div className="flex gap-2">
          {TEAM_TYPE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`flex items-center gap-1 px-3 py-2 rounded border transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 text-sm font-medium ${selectedType === opt.value ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              aria-pressed={selectedType === opt.value}
              aria-label={opt.label}
              tabIndex={0}
              onClick={() => setTeamType(opt.value as "class" | "club" | "study group" | "other")}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("type")} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Creating..." : "Create Team"}
      </Button>
      {/* Optimistic UI preview */}
      {optimisticTeams.length > 0 && (
        <div className="mt-4 animate-pulse">
          <div className="flex items-center gap-2">
            {TEAM_TYPE_OPTIONS.find((o) => o.value === optimisticTeams[0].type)?.icon}
            <span className="font-semibold">{optimisticTeams[0].name}</span>
            <span className="text-xs text-muted-foreground ml-2">{optimisticTeams[0].type}</span>
            <span className="ml-2 text-blue-500 animate-pulse">Creating...</span>
          </div>
        </div>
      )}
    </form>
  );
}
