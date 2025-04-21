"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";

const students = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "Active", class: "Math 101" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "Inactive", class: "Biology A" },
];

export default function StudentsPage() {
  const [search, setSearch] = React.useState("");
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button variant="default" size="sm">Add Student</Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Input
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Class</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell><Badge>{s.status}</Badge></TableCell>
                  <TableCell>{s.class}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
