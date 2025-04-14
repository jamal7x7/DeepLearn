"use client";

import React from "react";
import I18nProvider from "@/components/providers/I18nProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { Toaster } from "@/components/ui/sonner";

export default function AppClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <ActiveThemeProvider>
          {children}
          <Toaster />
        </ActiveThemeProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}