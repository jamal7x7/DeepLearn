import React from 'react';

// This layout simply renders its children, inheriting the layout from app/dashboard/layout.tsx
export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}