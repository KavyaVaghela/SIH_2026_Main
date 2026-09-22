"use client";

import * as React from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { SupportedLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

export interface LanguageSelectorProps {
  className?: string;
  compactOnMobile?: boolean;
}

export function LanguageSelector({
  className,
  compactOnMobile = true,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentLang =
    LANGUAGE_OPTIONS.find((l) => l.code === locale) || LANGUAGE_OPTIONS[0];

  const handleSelectLanguage = (code: SupportedLocale) => {
    setLocale(code);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block text-left", className)}
      data-testid="global-language-selector"
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id="global-language-selector-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language. Current: ${currentLang.nativeName}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none",
          "border border-border/80 bg-background/90 hover:bg-accent hover:text-accent-foreground text-foreground shadow-xs",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "ring-2 ring-primary/25 bg-accent text-accent-foreground border-primary/40"
        )}
      >
        <Globe
          className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        <span
          className={cn(
            "font-medium tracking-tight",
            compactOnMobile ? "hidden sm:inline" : "inline"
          )}
        >
          {currentLang.nativeName}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          id="global-language-selector-dropdown"
          aria-label="Available Languages"
          className={cn(
            "absolute right-0 z-50 mt-1.5 w-52 origin-top-right rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 focus:outline-none"
          )}
        >
          {/* Dropdown Heading: SELECT LANGUAGE / ભાષા પસંદ કરો */}
          <div className="border-b border-border/70 px-2.5 py-2 mb-1">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase leading-tight">
              SELECT LANGUAGE /
            </p>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 leading-tight">
              ભાષા પસંદ કરો
            </p>
          </div>

          {/* Language Options */}
          <div className="space-y-0.5" role="none">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  id={`language-option-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer select-none text-left",
                    isSelected
                      ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100 font-semibold"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xs">{lang.nativeName}</span>
                    {lang.name !== lang.nativeName && (
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground/80">
                        {lang.name}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check
                      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 font-bold"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
