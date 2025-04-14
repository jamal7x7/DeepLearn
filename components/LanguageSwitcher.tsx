"use client";

import { useTranslation } from "react-i18next";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof document !== "undefined") {
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          aria-label="Select language"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{LANGS.find(l => l.code === i18n.language)?.label || "EN"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2">
        <div className="flex flex-col gap-1">
          {LANGS.map((lang) => (
            <Button
              key={lang.code}
              variant={i18n.language === lang.code ? "default" : "ghost"}
              size="sm"
              className={`justify-start w-full text-left rounded ${i18n.language === lang.code ? "" : "hover:bg-accent"}`}
              onClick={() => handleChange(lang.code)}
              aria-label={`Switch to ${lang.label}`}
            >
              {lang.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}