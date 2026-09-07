"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubpageShellProps {
  title: string;
  description: string;
  moduleName: string;
  children?: React.ReactNode;
}

export function SubpageShell({ title, description, moduleName, children }: SubpageShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: moduleName },
        ]}
      />

      {!children && (
        <Card className="border shadow-sm p-8 text-center bg-card">
          <CardHeader className="space-y-3 max-w-md mx-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <Construction className="h-6 w-6 text-emerald-800 dark:text-emerald-300" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              {moduleName} Module Initialized
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              The shell layout and navigation routes for {moduleName} have been established under Task 1. Further detailed views and sub-features will be added in subsequent implementation tasks.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Link
              href="/super-admin"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-emerald-800/30 text-emerald-800 dark:text-emerald-300"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Super Admin Overview
            </Link>
          </CardContent>
        </Card>
      )}
      {children}
    </div>
  );
}
