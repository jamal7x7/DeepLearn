import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current user
  const user = await getUser();

  // If no user is logged in, redirect to sign-in
  if (!user) {
    redirect('/sign-in');
  }

  // If user is not an admin, redirect to regular dashboard
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all teams and monitor platform activity</p>
      </div>
      {children}
    </div>
  );
}