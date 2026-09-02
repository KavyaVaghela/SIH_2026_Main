import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function WorkerDashboardView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cooperative Worker Gig Portal"
        description="View incoming service requests, manage availability, track earnings, and access cooperative benefits."
        breadcrumbs={[{ label: "Worker Portal", href: "/worker" }, { label: "My Gigs" }]}
      />

      <Card className="border-dashed p-6 text-center text-muted-foreground">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Worker Mobile-First Layout Placeholder</CardTitle>
          <CardDescription>
            Structural layout initialized with mobile bottom navigation and desktop sidebar. Active job feeds and instant payout actions will be composed here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
