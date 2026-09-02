"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  const [selected, setSelected] = React.useState(activeTab || tabs[0]?.id);

  const currentTab = selected || activeTab || tabs[0]?.id;

  const handleSelect = (id: string) => {
    setSelected(id);
    onTabChange?.(id);
  };

  const activeContent = tabs.find((t) => t.id === currentTab)?.content;

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 sm:flex-none",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50 hover:text-foreground"
              )}
            >
              {tab.icon && <span className="mr-2 h-4 w-4">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeContent && <div className="pt-2">{activeContent}</div>}
    </div>
  );
}
