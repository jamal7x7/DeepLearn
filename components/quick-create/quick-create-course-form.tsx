"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const courseSchema = z.object({
  title: z.string().min(2, "Course title must be at least 2 characters"),
  code: z.string().min(2, "Course code must be at least 2 characters"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export function QuickCreateCourseForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
  });

  function onSubmit(data: CourseFormValues) {
    // TODO: API call
    alert(`Course Created: ${data.title} (${data.code})`);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block mb-1 font-medium">Course Title</label>
        <Input {...register("title")}
          placeholder="e.g. Calculus I"
          className="w-full" />
        {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
      </div>
      <div>
        <label className="block mb-1 font-medium">Course Code</label>
        <Input {...register("code")}
          placeholder="e.g. MATH101"
          className="w-full" />
        {errors.code && <span className="text-red-500 text-xs">{errors.code.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-2">Create Course</Button>
    </form>
  );
}
