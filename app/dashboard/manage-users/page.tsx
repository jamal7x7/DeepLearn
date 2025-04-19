'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Ban, CheckCircle } from "lucide-react"; // Icons for actions
import { useTranslation } from 'react-i18next'; // For i18n
import Jdenticon from "react-jdenticon"; // For Avatar fallback

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table'; // Import the generic DataTable
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For Avatar column
import { Badge } from "@/components/ui/badge"; // For Status column
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For Team Selection


// Define the User/Student type matching the expected data
type Student = {
  id: number;
  name: string | null;
  email: string;
  role: string; // Assuming role is available
  isFrozen: number; // 0 for active, 1 for frozen
  avatarUrl?: string | null; // Optional avatar URL
};

// Define the Team type
type Team = {
  id: number;
  name: string;
};

export default function ManageUsersPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(''); // Store as string for Select
  const [isLoading, setIsLoading] = useState(false);

  // Fetch teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        // Assuming an API endpoint exists to fetch teams the user manages
        const res = await fetch('/api/manage-users/teams'); // Adjust API endpoint if needed
        if (!res.ok) throw new Error('Failed to fetch teams');
        const data = await res.json();
        setTeams(data.teams || []);
        // Optionally select the first team by default
        if (data.teams && data.teams.length > 0) {
          setSelectedTeamId(data.teams[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
        // Handle error (e.g., show toast)
      }
    }
    fetchTeams();
  }, []);

  // Fetch students when selectedTeamId changes
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedTeamId) {
        setStudents([]); // Clear students if no team is selected
        return;
      }
      setIsLoading(true);
      try {
        // Fetch students for the selected team
        const res = await fetch(`/api/manage-users?teamId=${selectedTeamId}`); // API needs to support teamId query
        if (!res.ok) throw new Error('Failed to fetch students for team');
        const data = await res.json();
        // Assuming the API returns students with role information now
        setStudents(data.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]); // Clear students on error
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, [selectedTeamId]); // Re-run when selectedTeamId changes

  // --- Action Handlers ---
  async function handleDelete(id: number) {
    if (window.confirm(t('confirmDeleteUser', 'Are you sure you want to delete this user?'))) {
      try {
        const res = await fetch(`/api/manage-users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete user');
        setStudents(students.filter((s) => s.id !== id));
        // Show success toast
      } catch (error) {
        console.error("Error deleting user:", error);
        // Show error toast
      }
    }
  }

  async function handleToggleFreeze(id: number, currentStatus: number) {
    const action = currentStatus ? 'unfreeze' : 'freeze';
    if (window.confirm(t('confirmToggleFreeze', { action: t(action) }))) {
      try {
        const res = await fetch(`/api/manage-users/${id}/freeze`, { method: 'POST' }); // API toggles freeze status
        if (!res.ok) throw new Error(`Failed to ${action} user`);
        setStudents(students.map((s) => s.id === id ? { ...s, isFrozen: currentStatus ? 0 : 1 } : s));
        // Show success toast
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        // Show error toast
      }
    }
  }

  // --- Column Definitions for DataTable ---
  const columns: ColumnDef<Student>[] = [
    // Avatar Column
    {
      id: 'avatar',
      header: () => <div className="text-center">{t('avatar', 'Avatar')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatarUrl ?? undefined} alt={row.original.name ?? 'User Avatar'} />
            <AvatarFallback>
              <Jdenticon size={32} value={row.original.email || row.original.id.toString()} />
            </AvatarFallback>
          </Avatar>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Name Column
    {
      accessorKey: "name",
      header: t('name', 'Name'),
      cell: ({ row }) => row.original.name || t('noName', 'No Name'),
    },
    // Email Column
    {
      accessorKey: "email",
      header: t('email', 'Email'),
    },
    // Role Column
    {
      accessorKey: "role",
      header: t('role', 'Role'),
      cell: ({ row }) => <span className="capitalize">{t(row.original.role, row.original.role)}</span>, // Translate role if needed
      filterFn: (row, id, value) => { // Example filter function
        return value.includes(row.getValue(id))
      },
    },
    // Status Column
    {
      accessorKey: "isFrozen",
      header: t('status', 'Status'),
      cell: ({ row }) => (
        <Badge variant={row.original.isFrozen ? "destructive" : "secondary"}>
          {row.original.isFrozen ? t('frozen', 'Frozen') : t('active', 'Active')}
        </Badge>
      ),
      filterFn: (row, id, value) => { // Example filter function for status (0 or 1)
        const status = row.original.isFrozen ? 'frozen' : 'active';
        return value.includes(status);
      },
    },
    // Actions Column
    {
      id: "actions",
      header: () => <div className="text-right">{t('actions', 'Actions')}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id)}
            aria-label={t('delete', 'Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={row.original.isFrozen ? "text-green-600 hover:text-green-700" : "text-yellow-600 hover:text-yellow-700"}
            onClick={() => handleToggleFreeze(row.original.id, row.original.isFrozen)}
            aria-label={row.original.isFrozen ? t('unfreeze', 'Unfreeze') : t('freeze', 'Freeze')}
          >
            {row.original.isFrozen ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('manageUsers', 'Manage Users')}</h1>
        {/* Team Selector */}
        <div className="w-64">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger id="team-select" aria-label={t('selectTeam', 'Select Team')}>
              <SelectValue placeholder={t('selectTeam', 'Select Team')} />
            </SelectTrigger>
            <SelectContent>
              {teams.length === 0 && <SelectItem value="loading" disabled>{t('loadingTeams', 'Loading teams...')}</SelectItem>}
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataTable */}
      {isLoading ? (
        <p>{t('loadingStudents', 'Loading students...')}</p> // Add a loading indicator
      ) : selectedTeamId ? (
         <DataTable
            columns={columns}
            data={students}
            filterInputPlaceholder={t('filterStudents', 'Filter students...')} // i18n placeholder
         />
      ) : (
        <p>{t('pleaseSelectTeam', 'Please select a team to view students.')}</p> // Prompt to select team
      )}
    </div>
  );
}