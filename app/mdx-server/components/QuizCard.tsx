'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizCardProps {
  title: string;
  children: React.ReactNode;
}

export function QuizCard({ title, children }: QuizCardProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto my-8 p-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}