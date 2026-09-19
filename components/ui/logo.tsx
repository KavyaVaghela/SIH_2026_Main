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
  xs: { imgHeight: 24, imgWidth: 24, textClass: "text-xs", boxClass: "h-6" },
  sm: { imgHeight: 32, imgWidth: 32, textClass: "text-sm", boxClass: "h-8" },
  md: { imgHeight: 40, imgWidth: 40, textClass: "text-base", boxClass: "h-10" },
  lg: { imgHeight: 56, imgWidth: 56, textClass: "text-xl", boxClass: "h-14" },
  xl: { imgHeight: 80, imgWidth: 80, textClass: "text-2xl", boxClass: "h-20" },
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
    <div className={cn("inline-flex items-center gap-2.5 shrink-0 group select-none", className)}>
      <div className={cn("relative overflow-hidden rounded-lg bg-white border border-emerald-100 shadow-xs flex items-center justify-center shrink-0 p-0.5 transition-transform group-hover:scale-105", dims.boxClass)}>
        <Image
          src="/images/kaushalyasetu-logo.png"
          alt="KaushalyaSetu Emblem"
          width={dims.imgWidth}
          height={dims.imgHeight}
          className="object-contain h-full w-auto"
          priority
        />
      </div>

      {variant !== "icon" && (
        <div className="flex flex-col text-left">
          <span className={cn("font-bold leading-tight tracking-tight text-foreground group-hover:text-emerald-700 transition-colors", dims.textClass)}>
            KaushalyaSetu
          </span>
          {showTagline && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide leading-none mt-0.5">
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
