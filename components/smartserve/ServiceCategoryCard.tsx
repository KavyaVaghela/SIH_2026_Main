"use client";

import React from "react";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Trees,
  Car,
  Monitor,
  Smartphone,
  GraduationCap,
  Scissors,
  Truck,
  Flame,
  Square,
  Key,
  Droplets,
  Shirt,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { ServiceCategory } from "@/types/smartserve";

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Trees,
  Car,
  Monitor,
  Smartphone,
  GraduationCap,
  Scissors,
  Truck,
  Flame,
  Square,
  Key,
  Droplets,
  Shirt,
};

interface ServiceCategoryCardProps {
  category: ServiceCategory;
  onClick: (categoryName: string) => void;
  isSelected?: boolean;
}

export const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  category,
  onClick,
  isSelected = false,
}) => {
  const IconComponent = ICON_MAP[category.iconName] || Wrench;

  return (
    <button
      type="button"
      onClick={() => onClick(category.name)}
      className={`group relative flex flex-col justify-between text-left rounded-3xl p-5 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#075E43] ${
        isSelected
          ? "border-[#075E43] bg-[#E8F8F2] shadow-md ring-2 ring-[#075E43]/30"
          : "border-[#075E43]/20 bg-white hover:border-[#075E43] hover:bg-[#E8F8F2]/50 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div>
        {/* Icon Container */}
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F8F2] text-[#075E43] border border-[#075E43]/30 group-hover:bg-[#075E43] group-hover:text-white transition-colors">
            <IconComponent className="h-6 w-6" />
          </div>

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F8F2] text-[#17233C] group-hover:bg-[#075E43] group-hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mt-4 text-base font-bold tracking-tight text-[#17233C] group-hover:text-[#075E43] transition-colors">
          {category.name}
        </h3>
        <p className="mt-1 text-xs text-[#5F718A] line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Footer Meta info */}
      <div className="mt-4 flex items-center justify-between border-t border-[#075E43]/20 pt-3 text-[11px] font-semibold text-[#5F718A]">
        <span>{category.workerCount} Verified Workers</span>
        <span className="text-[#075E43] font-bold">Explore</span>
      </div>
    </button>
  );
};
