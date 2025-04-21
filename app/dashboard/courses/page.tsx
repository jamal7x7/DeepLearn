"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash } from "lucide-react";
import Link from "next/link";

const courses = [
  { id: "1", name: "Algebra Basics", teacher: "Dr. Alice", description: "Foundations of algebra." },
  { id: "2", name: "Genetics 101", teacher: "Mr. Bob", description: "Introduction to genetics." },
];

export default function CoursesPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link href="/dashboard/courses/new">
          <Button variant="default" size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Course
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.teacher}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell className="flex gap-2">
                    <Link href={`/dashboard/courses/${c.id}/edit`}>
                      <Button size="icon" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="destructive">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
