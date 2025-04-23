'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type Announcement = {
  id: number;
  teamName: string;
  content: string;
  sentAt: string;
  sender: string;
};

export default function AnnouncementHistory() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/announcements')
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(data.announcements || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching announcements:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        No announcement history found.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] w-full rounded-md">
      <div className="space-y-4 pr-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="bg-muted/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{announcement.teamName}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {new Date(announcement.sentAt).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <p className="text-sm mb-2">{announcement.content || ''}</p>
              <p className="text-xs text-muted-foreground">From: {announcement.sender}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}