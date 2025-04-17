"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function QuickCreateInviteForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  });

  function onSubmit(data: InviteFormValues) {
    // TODO: API call
    alert(`Invitation sent to: ${data.email}`);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block mb-1 font-medium">Invite by Email</label>
        <Input {...register("email")}
          placeholder="e.g. user@email.com"
          className="w-full" />
        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-2">Send Invitation</Button>
    </form>
  );
}
