'use client';

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AnnouncementCard, AnnouncementCardProps } from "@/components/AnnouncementCard";

// Real API call to fetch announcements for student's teams
async function fetchStudentAnnouncements() {
  const res = await fetch("/api/user/announcements", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch announcements");
  return await res.json();
}

export default function StudentDashboardPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchStudentAnnouncements()
      .then((data) => {
        setAnnouncements(data.announcements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8" >
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Users className="h-6 w-6 text-primary" />
        {t("teamAnnouncements")}
      </h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {t("noAnnouncements")}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} canEdit={false} />
          ))}
        </div>
      )}
    </div>
  );
}