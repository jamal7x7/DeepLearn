"use client";

import { useTranslation } from "react-i18next";
import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" }
];

export default function LanguageSwitcher({ animateGlobe = false }: { animateGlobe?: boolean } = {}) {
  const { i18n } = useTranslation();

  const handleChange = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof document !== "undefined") {
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative flex items-center justify-center ${animateGlobe ? ' animate-pulse' : ''}`}
          aria-label="Select language"
        >
          <Globe className="w-[1rem] h-[1rem] text-primary group-hover:scale-110 transition-transform" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={i18n.language === lang.code ? "font-bold text-primary" : ""}
            aria-label={`Switch to ${lang.label}`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}