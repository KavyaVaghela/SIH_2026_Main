"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Wrench, Search, RotateCcw } from "lucide-react";
import type { ManagedServiceItem } from "../types";

interface ServiceManagementTableProps {
  services: ManagedServiceItem[];
  onToggleService: (serviceId: string, isActive: boolean) => void;
  isSaving?: boolean;
}

export function ServiceManagementTable({
  services,
  onToggleService,
  isSaving,
}: ServiceManagementTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");

  const categories = Array.from(new Set(services.map((s) => s.category)));

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || srv.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              Trade Services Catalog & Availability
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Activate or temporarily pause individual marketplace offerings across customer booking forms.
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-bold bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 self-start sm:self-auto"
        >
          {activeCount} of {services.length} Services Active
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trade service name or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-muted-foreground">Trade:</span>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 text-xs w-48"
            >
              <option value="ALL">All Trade Guilds</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>

            {(searchQuery || categoryFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Services Table */}
        {filteredServices.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-muted/10 space-y-2">
            <p className="text-xs font-semibold text-foreground">No services matched your search.</p>
            <p className="text-[11px] text-muted-foreground">
              Try clearing filters or search terms to see available catalog services.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-foreground">Service Name & Scope</TableHead>
                <TableHead className="font-bold text-foreground">Trade Category</TableHead>
                <TableHead className="font-bold text-foreground">Standard Base Rate</TableHead>
                <TableHead className="font-bold text-foreground">Marketplace State</TableHead>
                <TableHead className="text-right font-bold text-foreground">Enable / Pause</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredServices.map((srv) => (
                <TableRow key={srv.id} className="hover:bg-muted/40 transition-colors">
                  {/* Service Title */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-foreground block">{srv.title}</span>
                      {srv.description && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1">
                          {srv.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge variant="secondary" className="text-[11px] font-semibold bg-muted text-foreground">
                      {srv.category}
                    </Badge>
                  </TableCell>

                  {/* Price */}
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-foreground">
                      ₹{srv.basePrice}/hr
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        srv.isActive
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {srv.isActive ? "Available" : "Paused"}
                    </Badge>
                  </TableCell>

                  {/* Switch Toggle */}
                  <TableCell className="text-right">
                    <Switch
                      checked={srv.isActive}
                      onCheckedChange={(val) => onToggleService(srv.id, val)}
                      disabled={isSaving}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
