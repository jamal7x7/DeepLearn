import { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Manage your classes and view student engagement',
};

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // Redirect if not logged in
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // Redirect if not a teacher (assuming role is stored in session)
  if (session.user.role !== 'teacher') {
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  );
}