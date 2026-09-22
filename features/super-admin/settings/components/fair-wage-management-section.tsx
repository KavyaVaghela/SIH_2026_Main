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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Scale,
  Search,
  ShieldCheck,
  Check,
  Edit2,
  X,
  RefreshCw,
  Info,
  TrendingUp,
  Lock,
} from "lucide-react";
import type { ManagedServiceItem } from "../types";

interface FairWageManagementSectionProps {
  services: ManagedServiceItem[];
  onUpdatePricing: (serviceId: string, basePrice: number, minimumVisitCharge: number) => Promise<void>;
  isSaving?: boolean;
}

export function FairWageManagementSection({
  services,
  onUpdatePricing,
  isSaving,
}: FairWageManagementSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");

  // Global inflation scenario adjustment for preview (% e.g., 5 for +5%)
  const [globalInflationPercent, setGlobalInflationPercent] = React.useState<number>(5);

  // Per-row edit state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editBasePrice, setEditBasePrice] = React.useState<number>(0);
  const [editMinVisit, setEditMinVisit] = React.useState<number>(0);
  const [editRowInflation, setEditRowInflation] = React.useState<number>(5);
  const [saveSuccessMsg, setSaveSuccessMsg] = React.useState<string | null>(null);

  const categories = Array.from(new Set(services.map((s) => s.category)));

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || srv.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleStartEdit = (srv: ManagedServiceItem) => {
    setEditingId(srv.id);
    setEditBasePrice(srv.basePrice);
    setEditMinVisit(srv.minimumVisitCharge);
    setEditRowInflation(globalInflationPercent);
    setSaveSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSaveSuccessMsg(null);
  };

  const handleApplyInflationToPrice = () => {
    const adjusted = Math.round(editBasePrice * (1 + editRowInflation / 100));
    setEditBasePrice(adjusted);
  };

  const handleApplyInflationToFloor = () => {
    const adjusted = Math.round(editMinVisit * (1 + editRowInflation / 100));
    setEditMinVisit(adjusted);
  };

  const handleSaveEdit = async (serviceId: string, title: string) => {
    try {
      await onUpdatePricing(serviceId, editBasePrice, editMinVisit);
      setEditingId(null);
      setSaveSuccessMsg(
        `Wage standard preview for "${title}" updated to ₹${editBasePrice} (Floor: ₹${editMinVisit}). Policy preview mode active — live customer booking pricing remains isolated and unchanged.`
      );
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch {
      // Handled by parent hook
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Scale className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold text-foreground">
              FAIR WAGE MANAGEMENT
            </CardTitle>
          </div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Central cooperative wage standards
          </p>
          <CardDescription className="text-xs text-muted-foreground">
            Maintain minimum and recommended worker wage standards across occupations and adjust them as economic conditions change (e.g. inflation adjustments).
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="text-xs font-bold bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 flex items-center gap-1"
          >
            <Lock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            Live Customer Pricing Isolated
          </Badge>
          <Badge
            variant="outline"
            className="text-xs font-bold bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-center gap-1"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Policy Governance Mode
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Explanatory Policy Banner */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
          <Info className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-semibold text-sm text-emerald-950 dark:text-emerald-100">
              Cooperative Wage Governance &amp; Price Protection Principle
            </p>
            <p>
              Kaushalya Setu protects worker earnings through service-level minimum pricing while maintaining a nominal cooperative platform sustainability fee.
            </p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              <strong>Safety Isolation Active:</strong> Super Admin centrally models and previews fair wage indexation across occupations. To protect existing customer booking tariffs, worker payout lifecycles, and invoice calculations, wage governance updates operate strictly in Policy Preview mode and do not modify live customer checkout pricing.
            </p>
          </div>
        </div>

        {/* Success Confirmation Banner */}
        {saveSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Filter, Search & Inflation Adjustment Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search occupation / trade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Category:</span>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 text-xs w-44"
              >
                <option value="ALL">All Categories ({services.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Inflation Simulation Scenario Control */}
          <div className="flex items-center space-x-2 border-t lg:border-t-0 pt-2 lg:pt-0">
            <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-foreground shrink-0">
              Inflation Scenario:
            </span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={globalInflationPercent}
                onChange={(e) => setGlobalInflationPercent(Number(e.target.value))}
                className="h-8 w-16 text-xs font-mono text-right"
              />
              <span className="text-xs font-bold text-muted-foreground">%</span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden xl:inline">
              (Live preview for rate indexation)
            </span>
          </div>
        </div>

        {/* Fair Wage Table */}
        <div className="rounded-lg border overflow-x-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/40 text-xs">
                <TableHead className="font-bold text-foreground">Occupation / Service</TableHead>
                <TableHead className="font-bold text-foreground">Category</TableHead>
                <TableHead className="font-bold text-foreground">Current Fair Wage Floor</TableHead>
                <TableHead className="font-bold text-foreground">Standard / Reference Rate</TableHead>
                <TableHead className="font-bold text-foreground">Price Unit</TableHead>
                <TableHead className="font-bold text-foreground">Inflation Adjustment</TableHead>
                <TableHead className="font-bold text-foreground">Adjusted Reference Rate</TableHead>
                <TableHead className="font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-foreground">Controls</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground italic">
                    No services matched the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((srv) => {
                  const isEditing = editingId === srv.id;
                  const rowInflation = isEditing ? editRowInflation : globalInflationPercent;
                  const currentRefRate = isEditing ? editBasePrice : srv.basePrice;
                  const adjustedRate = Math.round(currentRefRate * (1 + rowInflation / 100));
                  const unitLabel = srv.priceUnit === "per_hour" ? "/hr" : srv.priceUnit ? `/${srv.priceUnit}` : "/hr";

                  return (
                    <TableRow key={srv.id} className="hover:bg-muted/40 transition-colors text-xs">
                      {/* Occupation / Service */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-foreground block">{srv.title}</span>
                          {srv.description && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {srv.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-semibold bg-muted text-foreground">
                          {srv.category}
                        </Badge>
                      </TableCell>

                      {/* Current Fair Wage Floor */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold">₹</span>
                            <Input
                              type="number"
                              min={0}
                              value={editMinVisit}
                              onChange={(e) => setEditMinVisit(Number(e.target.value))}
                              className="h-7 w-20 text-xs font-mono"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                            ₹{srv.minimumVisitCharge}
                          </span>
                        )}
                      </TableCell>

                      {/* Standard / Recommended Rate */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold">₹</span>
                            <Input
                              type="number"
                              min={0}
                              value={editBasePrice}
                              onChange={(e) => setEditBasePrice(Number(e.target.value))}
                              className="h-7 w-20 text-xs font-mono"
                              disabled={isSaving}
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-foreground">
                            ₹{srv.basePrice}
                          </span>
                        )}
                      </TableCell>

                      {/* Price Unit */}
                      <TableCell>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {unitLabel}
                        </span>
                      </TableCell>

                      {/* Inflation Adjustment */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.5"
                              value={editRowInflation}
                              onChange={(e) => setEditRowInflation(Number(e.target.value))}
                              className="h-7 w-14 text-xs font-mono"
                              disabled={isSaving}
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            +{globalInflationPercent}%
                          </span>
                        )}
                      </TableCell>

                      {/* Adjusted Reference Rate */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            ₹{adjustedRate}
                          </span>
                          {isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleApplyInflationToPrice}
                              className="h-5 px-1.5 text-[9px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60"
                              title="Apply this calculated rate to Standard Rate"
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200"
                        >
                          Protected
                        </Badge>
                      </TableCell>

                      {/* Controls */}
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(srv.id, srv.title)}
                              disabled={isSaving}
                              className="h-7 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                              title="Save standard for policy preview"
                            >
                              {isSaving ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              <span>Preview Save</span>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(srv)}
                            disabled={isSaving}
                            className="h-7 text-xs border-border hover:bg-muted gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit Standard</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
