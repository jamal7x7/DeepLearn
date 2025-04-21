// Centralized feature flag utility

/**
 * Add new feature flags here. Set to true to enable, false to disable.
 * You can toggle these for development, staging, or production as needed.
 */
export const featureFlags = {
  teacherControl: true, // Toggle Teacher Control sidebar menu
};

/**
 * Helper to check if a feature is enabled.
 * @param flag Feature flag key
 */
export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return !!featureFlags[flag];
}


// You can now manage feature flags from an Admin (dev role) UI:

// What’s implemented:
// Database model for persistent feature flags.
// API endpoints (/api/admin/feature-flags) for secure get/set (dev-only).
// Admin UI page at /dashboard/admin/feature-flags:
// Lists all feature flags with toggle switches.
// Only accessible to dev-role users (API enforces this).
// Changes are persisted in the database.
// Feature flag utility can be extended to fetch from the DB for SSR/RSC if needed.
// How to use:
// Visit /dashboard/admin/feature-flags as a dev user.
// Toggle any feature flag (such as teacherControl) on or off.
// The sidebar and other features will react to these flags (after you update the utility to read from DB if you want SSR awareness).




// More granular access control,
// Environment-specific flags,
// UI improvements (descriptions, grouping, etc.),
// Or want the flag utility to always fetch from the DB for SSR,
