"use client";

import * as React from "react";
import { AlertTriangle, Calendar, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface ExpiringCertAlertProps {
  certName?: string;
  daysRemaining?: number;
}

export function ExpiringCertAlert({
  certName = "Electrical Safety Certificate",
  daysRemaining = 30,
}: ExpiringCertAlertProps) {
  const [isRenewalOpen, setIsRenewalOpen] = React.useState(false);
  const [isRenewed, setIsRenewed] = React.useState(false);

  const handleConfirmRenewal = () => {
    setIsRenewed(true);
    setTimeout(() => {
      setIsRenewalOpen(false);
    }, 1500);
  };

  return (
    <>
      <Alert className="border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <AlertTitle className="text-sm font-bold text-foreground">
                Expiring Certification Warning
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                <strong className="text-foreground font-semibold">{certName}</strong> expires in{" "}
                <span className="font-bold text-amber-700 dark:text-amber-400">{daysRemaining} days</span>. Renew now to maintain uninterrupted dispatch eligibility in high-voltage and dual-trade jobs.
              </AlertDescription>
            </div>
          </div>

          <div className="shrink-0 pt-2 sm:pt-0">
            <Button
              size="sm"
              onClick={() => setIsRenewalOpen(true)}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm"
            >
              Renew Certificate
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Alert>

      {/* Renewal Dialog Modal */}
      <Dialog
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        title="Renew Electrical Safety Certificate"
        description="Gujarat Labour Cooperative Federation annual refresher and renewal certification."
        footer={
          <div className="flex items-center space-x-2 justify-end w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setIsRenewalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isRenewed}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
              onClick={handleConfirmRenewal}
            >
              {isRenewed ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Application Submitted
                </>
              ) : (
                "Confirm Renewal Request"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs text-muted-foreground">
          <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
            <div className="text-xs font-semibold text-foreground">Certificate Information</div>
            <div>Title: <strong className="text-foreground">{certName}</strong></div>
            <div>Current Validity: <span className="text-amber-600 font-medium">Expires in {daysRemaining} days</span></div>
            <div>Federation Chapter: Gujarat Labour Cooperative Board, Ahmedabad</div>
          </div>

          <div className="flex items-start space-x-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              The renewal fee (₹300) is 100% subsidized by the ABC Labour Cooperative Society welfare fund for active members.
            </span>
          </div>

          {isRenewed && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700/30 text-emerald-800 dark:text-emerald-300 text-center font-medium">
              Renewal application successfully routed to ABC Labour Cooperative Society!
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
