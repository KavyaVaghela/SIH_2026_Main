"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  variant?: "full" | "icon" | "inline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  href?: string;
  onClick?: () => void;
}

const sizeDimensions = {
  xs: { imgHeight: 36, imgWidth: 36, textClass: "text-sm font-extrabold", taglineClass: "text-[9px]", boxClass: "h-9 w-9" },
  sm: { imgHeight: 48, imgWidth: 48, textClass: "text-base font-extrabold", taglineClass: "text-[10px]", boxClass: "h-12 w-12" },
  md: { imgHeight: 60, imgWidth: 60, textClass: "text-lg md:text-xl font-extrabold", taglineClass: "text-[11px]", boxClass: "h-14 w-14" },
  lg: { imgHeight: 84, imgWidth: 84, textClass: "text-2xl font-black", taglineClass: "text-xs", boxClass: "h-20 w-20" },
  xl: { imgHeight: 112, imgWidth: 112, textClass: "text-3xl md:text-4xl font-black", taglineClass: "text-sm", boxClass: "h-28 w-28" },
};

export function Logo({
  variant = "inline",
  size = "md",
  showTagline = false,
  taglineText = "Community Owned Digital Marketplace",
  className,
  href,
  onClick,
}: LogoProps) {
  const dims = sizeDimensions[size] || sizeDimensions.md;

  const logoContent = (
    <div className={cn("inline-flex items-center gap-3 shrink-0 group select-none", className)}>
      {/* Borderless Emblem Container with enlarged content */}
      <div className={cn("relative flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", dims.boxClass)}>
        <Image
          src="/images/kaushalyasetu-logo-transparent.png"
          alt="KaushalyaSetu Emblem"
          width={dims.imgWidth}
          height={dims.imgHeight}
          className="object-contain h-full w-auto max-h-full scale-110"
          priority
        />
      </div>

      {variant !== "icon" && (
        <div className="flex flex-col text-left justify-center">
          <span className={cn("font-black leading-tight tracking-tight text-foreground group-hover:text-emerald-700 transition-colors", dims.textClass)}>
            KaushalyaSetu
          </span>
          {showTagline && (
            <span className={cn("font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide leading-none mt-0.5", dims.taglineClass)}>
              {taglineText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
