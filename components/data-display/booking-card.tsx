import * as React from "react";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/status/status-badge";
import { formatINR } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface BookingCardProps {
  bookingId: string;
  serviceTitle: string;
  customerName?: string;
  workerName?: string;
  scheduledDate: string;
  scheduledTime: string;
  locationAddress: string;
  totalAmount: number;
  status: StatusType | string;
  onViewDetails?: (id: string) => void;
  className?: string;
}

export function BookingCard({
  bookingId,
  serviceTitle,
  customerName,
  workerName,
  scheduledDate,
  scheduledTime,
  locationAddress,
  totalAmount,
  status,
  onViewDetails,
  className,
}: BookingCardProps) {
  return (
    <Card className={cn("hover:shadow-sm transition-shadow", className)}>
      <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
        <div>
          <span className="text-xs font-mono text-muted-foreground uppercase">#{bookingId}</span>
          <h4 className="font-semibold text-base text-foreground leading-tight">{serviceTitle}</h4>
        </div>
        <StatusBadge status={status} />
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{scheduledDate}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{scheduledTime}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{locationAddress}</span>
        </div>

        {(customerName || workerName) && (
          <div className="text-xs text-muted-foreground">
            {customerName && <span>Customer: <strong className="text-foreground">{customerName}</strong></span>}
            {customerName && workerName && <span> • </span>}
            {workerName && <span>Worker: <strong className="text-foreground">{workerName}</strong></span>}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-xs text-muted-foreground">Total Fee: </span>
            <span className="font-bold text-base text-foreground">{formatINR(totalAmount)}</span>
          </div>

          {onViewDetails && (
            <Button onClick={() => onViewDetails(bookingId)} size="sm" variant="ghost">
              Details
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
