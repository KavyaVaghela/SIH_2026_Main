"use client";

import { useState } from "react";
import { LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "./config";

/**
 * Lightweight internationalization hook supporting EN, GU, and HI.
 */
export function useTranslation() {
  const [currentLocale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);

  function t(keyPath: string, fallback?: string): string {
    const dict = LOCALES[currentLocale]?.dict || LOCALES[DEFAULT_LOCALE].dict;
    const parts = keyPath.split(".");
    let result: unknown = dict;

    for (const part of parts) {
      if (result && typeof result === "object" && part in result) {
        result = (result as Record<string, unknown>)[part];
      } else {
        return fallback || keyPath;
      }
    }

    return typeof result === "string" ? result : fallback || keyPath;
  }

  return {
    t,
    locale: currentLocale,
    setLocale,
    supportedLocales: Object.keys(LOCALES) as SupportedLocale[],
  };
}
