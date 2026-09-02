import * as React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";

export function PendingView() {
  return (
    <Card className="w-full max-w-md shadow-md text-center">
      <CardHeader className="space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-xl">Cooperative Verification Pending</CardTitle>
        <CardDescription>
          Your member application has been submitted to the Federation Board.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusBadge status="pending" label="Under Federation Review" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Verification usually takes 24–48 hours. You will receive an SMS update once your skill certificates and identity documents are verified.
        </p>
      </CardContent>
      <CardFooter className="justify-center border-t pt-4">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Return to Sign In
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
