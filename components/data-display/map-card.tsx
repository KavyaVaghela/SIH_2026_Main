import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MapCardProps {
  locationName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distanceText?: string;
  onNavigate?: () => void;
  className?: string;
}

export function MapCard({
  locationName,
  address,
  distanceText,
  onNavigate,
  className,
}: MapCardProps) {
  return (
    <Card className={cn("overflow-hidden border shadow-sm", className)}>
      <div className="relative h-40 bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-b">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative flex flex-col items-center justify-center text-center p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-bounce">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-foreground mt-2 bg-background/80 px-2 py-0.5 rounded backdrop-blur">
            Interactive Map Visualizer
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm text-foreground">{locationName}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{address}</p>
          </div>
          {distanceText && (
            <span className="text-xs font-medium bg-muted px-2 py-1 rounded shrink-0">
              {distanceText}
            </span>
          )}
        </div>

        {onNavigate && (
          <Button onClick={onNavigate} size="sm" variant="outline" className="w-full mt-2">
            <Navigation className="mr-1.5 h-3.5 w-3.5" />
            Get Directions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
