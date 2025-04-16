"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface FeatureFlag {
  key: string;
  enabled: boolean;
}

export default function FeatureFlagsAdminPage() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then(res => res.json())
      .then(data => {
        setFlags(data.flags || []);
        setLoading(false);
      });
  }, []);

  const handleToggle = async (key: string, enabled: boolean) => {
    setSaving(key);
    const res = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    if (res.ok) {
      setFlags(flags => flags.map(f => f.key === key ? { ...f, enabled } : f));
      toast.success(t("flagUpdated", "Flag updated"));
    } else {
      toast.error(t("updateFailed", "Failed to update flag"));
    }
    setSaving(null);
  };

  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle>{t("featureFlags", "Feature Flags")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>{t("loading", "Loading...")}</div>
        ) : (
          <ul className="space-y-4">
            {flags.map(flag => (
              <li key={flag.key} className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm">{flag.key}</span>
                <Switch
                  checked={flag.enabled}
                  disabled={saving === flag.key}
                  onCheckedChange={v => handleToggle(flag.key, v)}
                  aria-label={t("toggleFlag", { flag: flag.key })}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
