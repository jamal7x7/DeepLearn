'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResourcesCardProps {
  title: string;
  children: React.ReactNode;
}

export function ResourcesCard({ title, children }: ResourcesCardProps) {
  return (
    <Card className="w-full gap-0 max-w-3xl mx-auto my-8 p-0 shadow-lg  border-b-muted">
      <CardHeader className="p-2 bg-gradient-to-r from-muted to-muted/20  rounded-t-lg">
        <CardTitle className="  mx-auto text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-blue-50/10 dark:bg-blue-900/10">
        {children}
      </CardContent>
    </Card>
  );
}