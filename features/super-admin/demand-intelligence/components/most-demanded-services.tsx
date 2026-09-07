"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { TrendingUp, AlertTriangle, CheckCircle2, Award } from "lucide-react";
import type { DemandedServiceItem } from "../types";

interface MostDemandedServicesProps {
  services: DemandedServiceItem[];
  isLoading?: boolean;
}

export function MostDemandedServices({ services, isLoading }: MostDemandedServicesProps) {
  if (isLoading) {
    return (
      <Card className="border shadow-sm p-6">
        <div className="h-64 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    );
  }

  // Format data for Recharts
  const chartData = services.slice(0, 5).map((item) => ({
    name: item.serviceTitle.length > 20 ? `${item.serviceTitle.slice(0, 18)}...` : item.serviceTitle,
    fullName: item.serviceTitle,
    Requests: item.requestsCount,
    "Available Workers": item.availableWorkersCount,
  }));

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-foreground">
            Most Demanded Services & Availability
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Top trade services generating maximum platform volume compared against active cooperative craftsmen
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Recharts Bar Chart Visualization */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
              <Bar
                dataKey="Requests"
                fill="#059669"
                name="Demand Requests"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Available Workers"
                fill="#0284c7"
                name="Available Workers"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Ranked Table */}
        <div className="pt-2 border-t space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
            <Award className="h-3.5 w-3.5 mr-1.5 text-emerald-700" />
            Ranked Service Demand Breakdown
          </h4>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-foreground">Service Name</TableHead>
                <TableHead className="font-bold text-foreground">Category</TableHead>
                <TableHead className="font-bold text-foreground">Demand</TableHead>
                <TableHead className="font-bold text-foreground">Available</TableHead>
                <TableHead className="font-bold text-foreground">Net Gap</TableHead>
                <TableHead className="font-bold text-foreground">Capacity State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((srv) => (
                <TableRow key={srv.serviceId} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-xs text-foreground">
                    {srv.serviceTitle}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {srv.category}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-foreground">
                    {srv.requestsCount}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-sky-700 dark:text-sky-400 font-semibold">
                    {srv.availableWorkersCount}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold">
                    {srv.deficitOrSurplus < 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        {srv.deficitOrSurplus} (Shortage)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{srv.deficitOrSurplus} (Surplus)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {srv.status === "SHORTAGE" ? (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-800 border-rose-200 text-[10px] font-bold"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1 text-rose-600 inline" />
                        Deficit
                      </Badge>
                    ) : srv.status === "SURPLUS" ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold"
                      >
                        Surplus
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
                        Balanced
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
