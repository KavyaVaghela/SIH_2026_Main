"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface WorkerStatusSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkerStatusSearch({ value, onChange }: WorkerStatusSearchProps) {
  return (
    <div className="relative max-w-md w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
      <Input
        type="text"
        placeholder="Filter by worker name or Worker ID..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 text-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
