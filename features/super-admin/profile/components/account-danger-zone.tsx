"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle } from "lucide-react";

interface AccountDangerZoneProps {
  onLogout: () => Promise<void>;
}

export function AccountDangerZone({ onLogout }: AccountDangerZoneProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await onLogout();
  };

  return (
    <Card className="border border-rose-200 dark:border-rose-950/70 shadow-sm bg-gradient-to-br from-card to-rose-50/20 dark:to-rose-950/10">
      <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-900/40">
        <div className="flex items-center space-x-2">
          <LogOut className="h-4 w-4 text-rose-600" />
          <CardTitle className="text-sm font-bold text-foreground">
            Session Termination & Sign Out
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Terminate the active administrative session. Secure cryptographic tokens stored in cookies will be purged.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-foreground">Sign Out of Super Admin Console</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ensures that administrative clearance tokens are invalidated across all active browser tabs.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          className="text-xs font-semibold shrink-0"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Sign Out of Account
        </Button>
      </CardContent>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm Sign Out</h3>
                <p className="text-xs text-muted-foreground">Administrative session close</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to terminate your Super Admin session? You will be redirected to the platform authentication page.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isLoggingOut}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="text-xs font-semibold"
              >
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
