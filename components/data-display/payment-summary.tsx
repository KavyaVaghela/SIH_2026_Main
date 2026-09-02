import * as React from "react";
import { ShieldCheck, CreditCard } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface PaymentSummaryProps {
  basePrice: number;
  platformFee: number;
  taxAmount: number;
  discountAmount?: number;
  totalPayable: number;
  razorpayEnabled?: boolean;
  className?: string;
}

export function PaymentSummary({
  basePrice,
  platformFee,
  taxAmount,
  discountAmount = 0,
  totalPayable,
  razorpayEnabled = true,
  className,
}: PaymentSummaryProps) {
  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <CardHeader className="p-0 pb-3 border-b">
        <h4 className="font-semibold text-sm flex items-center">
          <CreditCard className="mr-2 h-4 w-4 text-primary" />
          Payment Breakdown
        </h4>
      </CardHeader>

      <CardContent className="p-0 space-y-2.5 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Service Base Rate</span>
          <span className="font-medium text-foreground">{formatINR(basePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cooperative Welfare Platform Fee</span>
          <span className="font-medium text-foreground">{formatINR(platformFee)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST & Government Levies</span>
          <span className="font-medium text-foreground">{formatINR(taxAmount)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Cooperative Subsidy / Discount</span>
            <span className="font-medium">-{formatINR(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between pt-2.5 border-t text-sm font-bold text-foreground">
          <span>Total Net Amount</span>
          <span className="text-primary text-base">{formatINR(totalPayable)}</span>
        </div>

        {razorpayEnabled && (
          <div className="pt-2 flex items-center justify-center text-[11px] text-muted-foreground bg-muted/30 py-1.5 rounded border border-dashed">
            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            Protected by Cooperative Escrow & Razorpay Gateway
          </div>
        )}
      </CardContent>
    </Card>
  );
}
