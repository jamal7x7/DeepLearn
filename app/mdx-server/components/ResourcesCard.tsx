'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResourcesCardProps {
  title: string;
  children: React.ReactNode;
}

export function ResourcesCard({ title, children }: ResourcesCardProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto my-8 p-0 shadow-lg border-l-4 border-blue-500">
      <CardHeader className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
        <CardTitle className="  mx-auto text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-blue-50 dark:bg-blue-900/20">
        {children}
      </CardContent>
    </Card>
  );
}