import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingProps {
  value: number; // e.g., 4.5
  max?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  showScore?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-6 w-6",
};

export function Rating({
  value,
  max = 5,
  readOnly = true,
  onChange,
  showScore = true,
  size = "default",
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn("inline-flex items-center space-x-1", className)}>
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: max }).map((_, idx) => {
          const starNumber = idx + 1;
          const isFilled = activeValue >= starNumber;
          const isHalf = !isFilled && activeValue >= starNumber - 0.5;

          return (
            <button
              key={idx}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(starNumber)}
              onMouseEnter={() => !readOnly && setHoverValue(starNumber)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              className={cn(
                "p-0.5 focus:outline-none transition-transform",
                !readOnly && "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled || isHalf
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>
      {showScore && (
        <span className="text-xs font-semibold text-foreground ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
