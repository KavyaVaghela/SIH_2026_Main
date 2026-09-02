import * as React from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rating } from "./rating";
import { formatINR } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface WorkerCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  skillName: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  distanceKm?: number;
  isVerified?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export function WorkerCard({
  id,
  name,
  avatarUrl,
  skillName,
  rating,
  completedJobs,
  hourlyRate,
  distanceKm,
  isVerified = true,
  onSelect,
  className,
}: WorkerCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar src={avatarUrl} fallback={name} size="lg" />
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-semibold text-sm text-foreground">{name}</h4>
                {isVerified && (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{skillName}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {formatINR(hourlyRate)}/hr
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <Rating value={rating} size="sm" />
          <span>{completedJobs} jobs completed</span>
          {distanceKm !== undefined && (
            <span className="flex items-center">
              <MapPin className="mr-0.5 h-3 w-3" />
              {distanceKm} km away
            </span>
          )}
        </div>

        {onSelect && (
          <Button onClick={() => onSelect(id)} size="sm" className="w-full">
            View & Book Service
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
