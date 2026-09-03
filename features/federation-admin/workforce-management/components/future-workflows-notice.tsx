"use client";

import * as React from "react";
import { Info, Clock, UserCheck, FileEdit } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FutureWorkflowsNotice() {
  return (
    <Card className="border border-dashed border-border/80 bg-muted/20 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-semibold text-foreground">
              Future Administrative Workflows
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
            STAGE 5 SCHEDULED
          </Badge>
        </div>
        <CardDescription className="text-[11px] text-muted-foreground">
          Additional administrative pipelines planned for the next implementation phase
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded border border-border/40 bg-card/60 space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-foreground text-[11px]">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>New Worker Application Requests</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Public self-registration review queue and credential verification for incoming applicants will be introduced in Task 5.
            </p>
          </div>

          <div className="p-2.5 rounded border border-border/40 bg-card/60 space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-foreground text-[11px]">
              <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Worker Information Change Requests</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Worker-initiated profile and skill change approval pipelines will be implemented in Task 5.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
