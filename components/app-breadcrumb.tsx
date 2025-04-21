"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import React from 'react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

/**
 * Maps route segments to translation keys or readable names.
 * Extend this map for custom sidebar/submenu names.
 */
const SEGMENT_LABELS: Record<string, string> = {

  dashboard: "dashboard",
  documents: "documents",
  settings: "settings",
  "settings-dashboard": "settingsDashboard",
  team: "team",
  "invite-team": "inviteTeam",
  // Add more as needed
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Split and filter empty segments
  const segments = pathname?.split("/").filter(Boolean) ?? [];

  // Build breadcrumb items
  const crumbs = segments.map((segment, idx) => {
    // Use translation if available, fallback to capitalized segment
    const labelKey = SEGMENT_LABELS[segment] || segment;
    const label = t(labelKey, labelKey.charAt(0).toUpperCase() + labelKey.slice(1));
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const isLast = idx === segments.length - 1;
    return { label, href, isLast };
  });

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator key={"sep-" + idx} />
            <BreadcrumbItem key={crumb.href}>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
