"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const attendance = [
  { id: "1", student: "John Doe", class: "Math 101", date: "2025-04-21", status: "Present" },
  { id: "2", student: "Jane Smith", class: "Biology A", date: "2025-04-21", status: "Absent" },
];

export default function AttendancePage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <Button variant="default" size="sm">Mark Attendance</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.student}</TableCell>
                  <TableCell>{a.class}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell><Badge>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
