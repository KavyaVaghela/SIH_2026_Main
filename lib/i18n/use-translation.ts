"use client";

import { useLanguage } from "./language-context";
import { LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "./config";

/**
 * Global reactive internationalization hook supporting EN, GU, and HI.
 * Reactively connects to LanguageProvider with safe fallback.
 */
export function useTranslation() {
  const language = useLanguage();

  const locale = language?.locale || DEFAULT_LOCALE;
  const setLocale = language?.setLocale || (() => {});
  const supportedLocales = language?.supportedLocales || (Object.keys(LOCALES) as SupportedLocale[]);
  const t = language?.t || ((keyPath: string, fallback?: string) => {
    const dict = LOCALES[DEFAULT_LOCALE].dict;
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
  });

  return {
    t,
    locale,
    setLocale,
    supportedLocales,
  };
}

