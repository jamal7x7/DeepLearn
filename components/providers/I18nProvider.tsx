"use client";

import React, { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import i18n from "../../i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  // Set dir attribute for RTL languages
  const { i18n: i18next } = useTranslation();

  //  useEffect(() => {
  //   if (typeof document !== "undefined") {
  //     document.documentElement.dir = i18next.language === "ar" ? "rtl" : "ltr";
  //   }
  // }, [i18next.language]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = "ltr";
    }
  }, [i18next.language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}