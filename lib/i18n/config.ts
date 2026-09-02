import en from "./locales/en.json";
import gu from "./locales/gu.json";
import hi from "./locales/hi.json";

export type SupportedLocale = "en" | "gu" | "hi";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALES: Record<SupportedLocale, { name: string; nativeName: string; dict: Record<string, unknown> }> = {
  en: { name: "English", nativeName: "English", dict: en as Record<string, unknown> },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી", dict: gu as Record<string, unknown> },
  hi: { name: "Hindi", nativeName: "हिन्दी", dict: hi as Record<string, unknown> },
};
