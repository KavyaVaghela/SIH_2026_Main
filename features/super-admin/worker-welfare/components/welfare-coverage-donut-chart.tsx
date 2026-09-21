"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DONUT_COVERAGE_DATA } from "../data/welfare-mock-data";

export function WelfareCoverageDonutChart() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="border border-border/80 shadow-sm flex flex-col justify-between h-full min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <PieIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground truncate">
              Welfare Coverage Overview
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Overall welfare coverage across all federations
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col items-center justify-between flex-1 min-w-0 max-w-full">
        {/* Donut Chart Container */}
        <div className="relative w-full h-[180px] flex items-center justify-center min-w-0 max-w-full overflow-hidden">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DONUT_COVERAGE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DONUT_COVERAGE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString(), "Workers"]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          )}

          {/* Center Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-foreground tracking-tight">70%</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Coverage
            </span>
          </div>
        </div>

        {/* Custom Legend */}
        <div className="w-full space-y-2 pt-2 border-t border-border/60 text-xs min-w-0">
          {DONUT_COVERAGE_DATA.map((item) => (
            <div key={item.name} className="flex items-center justify-between font-medium gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground truncate">{item.name}</span>
              </div>
              <span className="font-bold text-foreground shrink-0 text-right">
                {item.value.toLocaleString()}{" "}
                <span className="text-muted-foreground font-normal">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
