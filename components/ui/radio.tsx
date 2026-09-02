import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onSelect"> {
  value: string;
  label?: string;
  checked?: boolean;
  onSelect?: (value: string) => void;
}

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, value, label, checked, onSelect, disabled, name, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center space-x-2 cursor-pointer select-none text-sm font-medium",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative inline-flex items-center">
          <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={() => onSelect?.(value)}
            disabled={disabled}
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "h-4 w-4 rounded-full border border-primary ring-offset-background flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              checked ? "border-primary" : "bg-background"
            )}
          >
            {checked && <div className="h-2 w-2 rounded-full bg-primary" />}
          </div>
        </div>
        {label && <span className="text-foreground">{label}</span>}
      </label>
    );
  }
);
RadioItem.displayName = "RadioItem";

export { RadioItem };
