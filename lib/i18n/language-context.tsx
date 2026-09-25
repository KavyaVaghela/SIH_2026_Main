"use client";

import * as React from "react";
import { LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "./config";
import { createClient } from "@/lib/supabase/client";

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  supportedLocales: SupportedLocale[];
  t: (keyPath: string, paramsOrFallback?: string | TranslationParams, fallback?: string) => string;
}

export const LanguageContext = React.createContext<LanguageContextValue | null>(null);

const STORAGE_GLOBAL_KEY = "kaushalyasetu_preferred_lang";
const STORAGE_USER_PREFIX = "kaushalyasetu_lang_";
const COOKIE_KEY = "kaushalyasetu_locale";

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}|\{\{(\w+)\}\}/g, (match, p1, p2) => {
    const key = p1 || p2;
    return key in params && params[key] !== undefined && params[key] !== null ? String(params[key]) : match;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<SupportedLocale>(DEFAULT_LOCALE);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Sync translation function with active locale, supporting fallback to English and variable interpolation
  const t = React.useCallback(
    (keyPath: string, paramsOrFallback?: string | TranslationParams, maybeFallback?: string): string => {
      const fallback = typeof paramsOrFallback === "string" ? paramsOrFallback : maybeFallback;
      const params = typeof paramsOrFallback === "object" && paramsOrFallback !== null ? paramsOrFallback : undefined;

      const dict = LOCALES[locale]?.dict || LOCALES[DEFAULT_LOCALE].dict;
      const parts = keyPath.split(".");
      let result: unknown = dict;
      let found = true;

      for (const part of parts) {
        if (result && typeof result === "object" && part in result) {
          result = (result as Record<string, unknown>)[part];
        } else {
          found = false;
          break;
        }
      }

      if (found && typeof result === "string") {
        return interpolate(result, params);
      }

      // If missing in current locale, fallback to English dictionary
      if (locale !== DEFAULT_LOCALE) {
        const enDict = LOCALES[DEFAULT_LOCALE].dict;
        let enResult: unknown = enDict;
        let enFound = true;
        for (const part of parts) {
          if (enResult && typeof enResult === "object" && part in enResult) {
            enResult = (enResult as Record<string, unknown>)[part];
          } else {
            enFound = false;
            break;
          }
        }
        if (enFound && typeof enResult === "string") {
          return interpolate(enResult, params);
        }
      }

      return interpolate(fallback || keyPath, params);
    },
    [locale]
  );

  // Persist language change safely
  const setLocale = React.useCallback(
    (newLocale: SupportedLocale) => {
      if (!LOCALES[newLocale]) return;

      setLocaleState(newLocale);

      try {
        if (typeof window !== "undefined") {
          // 1. Persist to general localStorage
          localStorage.setItem(STORAGE_GLOBAL_KEY, newLocale);

          // 2. Persist to account-scoped localStorage if user is signed in
          if (currentUserId) {
            localStorage.setItem(`${STORAGE_USER_PREFIX}${currentUserId}`, newLocale);
          }

          // 3. Set cookie for SSR/edge routes
          document.cookie = `${COOKIE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

          // 4. Update html tag lang attribute
          document.documentElement.lang = newLocale;

          // 5. Dispatch custom event for external sync
          window.dispatchEvent(
            new CustomEvent("kaushalyasetu:locale_changed", {
              detail: { locale: newLocale },
            })
          );
        }
      } catch (err) {
        console.warn("Could not persist language preference to client storage:", err);
      }

      // 6. Asynchronously sync to Supabase user metadata if authenticated
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user?.id) {
            supabase.auth.updateUser({
              data: { preferred_language: newLocale },
            }).catch(() => {
              // Ignore network or permission error silently to avoid blocking UI
            });
          }
        }).catch(() => {});
      } catch {
        // Ignore supabase client initialization errors gracefully
      }
    },
    [currentUserId]
  );

  // Initial client hydration & Auth listener
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Helper to validate and pick locale
    const resolveValidLocale = (val: unknown): SupportedLocale | null => {
      if (typeof val === "string" && (val === "en" || val === "gu" || val === "hi")) {
        return val as SupportedLocale;
      }
      if (val === "English") return "en";
      if (val === "Gujarati") return "gu";
      if (val === "Hindi") return "hi";
      return null;
    };

    // 1. Check general storage first for immediate paint
    try {
      const savedGlobal = localStorage.getItem(STORAGE_GLOBAL_KEY);
      const valid = resolveValidLocale(savedGlobal);
      if (valid) {
        setLocaleState(valid);
        document.documentElement.lang = valid;
      }
    } catch {
      // localStorage may be disabled
    }


    // 2. Check authenticated user and account-scoped preference
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.id) {
          setCurrentUserId(user.id);

          // Check user-scoped localStorage
          const userSpecific = localStorage.getItem(`${STORAGE_USER_PREFIX}${user.id}`);
          const validUserSpecific = resolveValidLocale(userSpecific);

          // Check user_metadata
          const metadataLang = resolveValidLocale(user.user_metadata?.preferred_language);

          const preferred = validUserSpecific || metadataLang;
          if (preferred) {
            setLocaleState(preferred);
            document.documentElement.lang = preferred;
            localStorage.setItem(STORAGE_GLOBAL_KEY, preferred);
          }
        }
      }).catch(() => {});

      // Listen to auth state change (login/logout/switch account)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        if (user?.id) {
          setCurrentUserId(user.id);
          const userSpecific = localStorage.getItem(`${STORAGE_USER_PREFIX}${user.id}`);
          const validUserSpecific = resolveValidLocale(userSpecific);
          const metadataLang = resolveValidLocale(user.user_metadata?.preferred_language);
          const preferred = validUserSpecific || metadataLang;
          if (preferred) {
            setLocaleState(preferred);
            document.documentElement.lang = preferred;
          }
        } else {
          setCurrentUserId(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignore if supabase client fails
    }
  }, []);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      supportedLocales: Object.keys(LOCALES) as SupportedLocale[],
      t,
    }),
    [locale, setLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Fallback safe dummy context if invoked outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      supportedLocales: Object.keys(LOCALES) as SupportedLocale[],
      t: (keyPath: string, paramsOrFallback?: string | TranslationParams, maybeFallback?: string) => {
        const fallback = typeof paramsOrFallback === "string" ? paramsOrFallback : maybeFallback;
        const params = typeof paramsOrFallback === "object" && paramsOrFallback !== null ? paramsOrFallback : undefined;
        const dict = LOCALES[DEFAULT_LOCALE].dict;
        const parts = keyPath.split(".");
        let result: unknown = dict;
        for (const part of parts) {
          if (result && typeof result === "object" && part in result) {
            result = (result as Record<string, unknown>)[part];
          } else {
            return interpolate(fallback || keyPath, params);
          }
        }
        return typeof result === "string" ? interpolate(result, params) : interpolate(fallback || keyPath, params);
      },
    };
  }
  return context;
}
