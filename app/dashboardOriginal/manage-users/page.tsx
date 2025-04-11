'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type User = {
  id: number;
  name: string | null;
  email: string;
  isFrozen: number;
};

export default function ManageUsersPage() {
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      const res = await fetch('/api/manage-users');
      const data = await res.json();
      setStudents(data.students);
    }
    fetchStudents();
  }, []);

  async function handleDelete(id: number) {
    await fetch(`/api/manage-users/${id}`, { method: 'DELETE' });
    setStudents(students.filter((s) => s.id !== id));
  }

  async function handleToggleFreeze(id: number) {
    await fetch(`/api/manage-users/${id}/freeze`, { method: 'POST' });
    setStudents(students.map((s) => s.id === id ? { ...s, isFrozen: s.isFrozen ? 0 : 1 } : s));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Students</h1>
      <ul className="space-y-4">
        {students.map((student) => (
          <li key={student.id} className="flex justify-between items-center border p-4 rounded">
            <div>
              <div className="font-semibold">{student.name || 'No Name'}</div>
              <div className="text-sm text-gray-500">{student.email}</div>
              <div className="text-sm">{student.isFrozen ? 'Frozen' : 'Active'}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleDelete(student.id)}>Delete</Button>
              <Button onClick={() => handleToggleFreeze(student.id)}>
                {student.isFrozen ? 'Unfreeze' : 'Freeze'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}