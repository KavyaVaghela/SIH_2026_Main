"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  User,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters/currency";
import { workerJobService } from "../services/worker-job-service";
import type { WorkerJobItem, WorkerBillItemPayload } from "../types";

export interface WorkerServiceBillViewProps {
  bookingId: string;
}

export function WorkerServiceBillView({ bookingId }: WorkerServiceBillViewProps) {
  const router = useRouter();
  const [job, setJob] = React.useState<WorkerJobItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Bill Line Items
  const [laborAmount, setLaborAmount] = React.useState<number>(400);
  const [materialItems, setMaterialItems] = React.useState<WorkerBillItemPayload[]>([
    { description: "Replacement Pipe & Coupling", quantity: 1, unitPrice: 150 },
    { description: "Industrial Sealant Tape", quantity: 1, unitPrice: 50 },
  ]);

  // Form Inputs for New Material Item
  const [newDesc, setNewDesc] = React.useState("");
  const [newQty, setNewQty] = React.useState<number>(1);
  const [newPrice, setNewPrice] = React.useState<number>(0);

  const loadJob = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await workerJobService.getJobDetails(bookingId);
      if (data) {
        setJob(data);

        // Prefill labor from estimate if available, otherwise fallback to reasonable base
        if (data.workerEstimateLabor && data.workerEstimateLabor > 0) {
          setLaborAmount(data.workerEstimateLabor);
        } else if (data.totalAmount && data.totalAmount > 0) {
          setLaborAmount(Math.round(data.totalAmount * 0.7));
        }

        // If booking already had recorded materialsUsed from Task 6, seed initial material lines
        if (data.materialsUsed && data.materialsUsed.length > 0) {
          const seeded = data.materialsUsed.map((m) => ({
            description: m,
            quantity: 1,
            unitPrice: 75,
          }));
          setMaterialItems(seeded);
        }
      } else {
        setErrorMessage("Service booking not found.");
      }
    } catch (err) {
      console.error("Failed to load booking for billing", err);
      setErrorMessage("Failed to load service booking details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Calculations (aligned with InvoiceService)
  const itemsSubtotal = React.useMemo(() => {
    const materialsTotal = materialItems.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    return Math.max(0, (Number(laborAmount) || 0) + materialsTotal);
  }, [laborAmount, materialItems]);

  const platformFee = Math.round(itemsSubtotal * 0.05 * 100) / 100; // 5% Cooperative fee
  const taxAmount = Math.round(itemsSubtotal * 0.18 * 100) / 100;   // 18% GST
  const finalTotalAmount = Math.round((itemsSubtotal + platformFee + taxAmount) * 100) / 100;

  // Add Item to Materials List
  const handleAddMaterial = () => {
    const trimmed = newDesc.trim();
    if (!trimmed) {
      setErrorMessage("Please enter an item description.");
      return;
    }
    if (newQty <= 0) {
      setErrorMessage("Item quantity must be greater than 0.");
      return;
    }
    if (newPrice < 0) {
      setErrorMessage("Item unit price cannot be negative.");
      return;
    }

    setMaterialItems((prev) => [
      ...prev,
      { description: trimmed, quantity: newQty, unitPrice: newPrice },
    ]);
    setNewDesc("");
    setNewQty(1);
    setNewPrice(0);
    setErrorMessage(null);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setMaterialItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Final Bill
  const handleGenerateBill = async () => {
    if (!job || isSubmitting) return;

    if (job.status !== "SERVICE_COMPLETED") {
      setErrorMessage(`Cannot generate bill when booking status is ${job.status}. Expected SERVICE_COMPLETED.`);
      return;
    }

    if (laborAmount <= 0 && materialItems.length === 0) {
      setErrorMessage("The bill must include a service charge or at least one material item.");
      return;
    }

    // Compile line items
    const allItems: WorkerBillItemPayload[] = [];
    if (laborAmount > 0) {
      allItems.push({
        description: `Service Labor: ${job.serviceTitle}`,
        quantity: 1,
        unitPrice: laborAmount,
      });
    }
    materialItems.forEach((m) => allItems.push(m));

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await workerJobService.generateServiceBill({
        bookingId: job.id,
        workerId: "w-1",
        items: allItems,
      });

      setSuccessMessage(
        `Service Bill #${result.invoice.invoiceNumber} for ${formatINR(result.invoice.totalAmount)} generated! Redirecting to active job view...`
      );

      setTimeout(() => {
        router.push(`/worker/jobs/${job.id}`);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to generate bill", err);
      setErrorMessage(err?.message || "Failed to generate service bill. Please verify details.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Create Service Bill"
          description="Loading service execution details..."
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
            { label: "Create Bill" },
          ]}
        />
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">Loading service details...</p>
        </Card>
      </div>
    );
  }

  if (errorMessage && !job) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Create Service Bill"
          breadcrumbs={[
            { label: "Worker Portal", href: "/worker" },
            { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
            { label: "Create Bill" },
          ]}
        />
        <Card className="p-8 text-center text-destructive border-destructive/30 bg-destructive/5 space-y-3">
          <p className="text-base font-semibold">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/worker/schedule?tab=active")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Return to Schedule &amp; Jobs
          </Button>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Create Service Bill #${job.bookingNumber}`}
        description="Itemize completed labor, replacement materials, and generate the final customer invoice."
        breadcrumbs={[
          { label: "Worker Portal", href: "/worker" },
          { label: "Schedule & Jobs", href: "/worker/schedule?tab=active" },
          { label: `Job #${job.bookingNumber}`, href: `/worker/jobs/${job.id}` },
          { label: "Create Bill" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/worker/jobs/${job.id}`)}
            className="text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Active Job
          </Button>
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pricing Rule Guidance Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-600/30 text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Final Bill vs. Estimates:</span>
          <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-200/80">
            The final bill is based on the <strong>actual work completed and materials used</strong>. It is independent of the initial platform estimate ({formatINR(job.totalAmount)}) or previous worker estimate ({job.workerEstimateAmount ? formatINR(job.workerEstimateAmount) : "N/A"}).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Service Summary & Bill Line Items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Service & Customer Context Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-foreground">
                    {job.serviceTitle}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-600/40 text-emerald-800 dark:text-emerald-300">
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-primary" /> Customer
                  </span>
                  <p className="text-sm font-bold text-foreground">{job.customerName}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <span className="text-muted-foreground flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Service Location
                  </span>
                  <p className="text-sm font-bold text-foreground">{job.customerArea}</p>
                </div>
              </div>

              {job.workNotes && (
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <span className="font-semibold text-muted-foreground flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Diagnostic &amp; Work Notes
                  </span>
                  <p className="text-foreground leading-relaxed">{job.workNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items Entry Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Receipt className="h-4 w-4 mr-1.5 text-emerald-600" />
                Service Charges &amp; Itemized Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-5 text-xs sm:text-sm">
              {/* Service Labor Charge */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Service Labor Charge (₹)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Actual labor charge for completed work
                  </span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={laborAmount}
                    onChange={(e) => setLaborAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Materials & Extra Parts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Replacement Materials &amp; Parts Used ({materialItems.length})
                  </span>
                </div>

                {/* Existing Items Table */}
                {materialItems.length > 0 ? (
                  <div className="divide-y border rounded-lg overflow-hidden bg-card text-xs">
                    <div className="grid grid-cols-12 gap-2 p-2.5 bg-muted/40 font-semibold text-muted-foreground">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit (₹)</div>
                      <div className="col-span-2 text-right">Total (₹)</div>
                    </div>
                    {materialItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 items-center">
                        <div className="col-span-6 font-medium text-foreground flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <span>{item.description}</span>
                        </div>
                        <div className="col-span-2 text-center font-mono">{item.quantity}</div>
                        <div className="col-span-2 text-right font-mono">{formatINR(item.unitPrice)}</div>
                        <div className="col-span-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatINR(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 border rounded-lg text-xs text-muted-foreground italic text-center">
                    No extra materials entered. Click below to add replacement parts if required.
                  </p>
                )}

                {/* Add New Material Line */}
                <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Add Material / Additional Work Line Item:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Item description (e.g. Brass Cartridge 35mm)"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="sm:col-span-6 px-3 py-1.5 text-xs border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={newQty}
                      onChange={(e) => setNewQty(Math.max(1, Number(e.target.value) || 1))}
                      className="sm:col-span-2 px-2 py-1.5 text-xs border rounded-lg bg-card text-foreground text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Price (₹)"
                      value={newPrice || ""}
                      onChange={(e) => setNewPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="sm:col-span-2 px-2 py-1.5 text-xs border rounded-lg bg-card text-foreground text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddMaterial}
                      className="sm:col-span-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Final Invoice Preview & Bill Generation */}
        <div className="space-y-5">
          <Card className="border-border shadow-sm sticky top-6">
            <CardHeader className="p-4 sm:p-5 border-b pb-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">
                  Final Invoice Preview
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold border-emerald-600/40 text-emerald-800">
                  GST Compliant
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Breakdown */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Service Labor Charge:</span>
                  <span className="font-mono font-medium text-foreground">{formatINR(laborAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Materials &amp; Parts Subtotal:</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatINR(itemsSubtotal - laborAmount)}
                  </span>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs font-semibold text-foreground">
                  <span>Net Work Subtotal:</span>
                  <span className="font-mono font-bold">{formatINR(itemsSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>Cooperative Platform Fee (5%):</span>
                  <span className="font-mono">{formatINR(platformFee)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                  <span>GST / Taxes (18%):</span>
                  <span className="font-mono">{formatINR(taxAmount)}</span>
                </div>

                <div className="pt-3 border-t flex justify-between items-center text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Final Bill Total:</span>
                  <span className="font-mono text-base">{formatINR(finalTotalAmount)}</span>
                </div>
              </div>

              {/* Estimate Comparison */}
              <div className="p-3 rounded-lg border bg-muted/20 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Platform Estimate:</span>
                  <strong className="text-foreground">{formatINR(job.totalAmount)}</strong>
                </div>
                {job.workerEstimateAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreed Worker Estimate:</span>
                    <strong className="text-foreground">{formatINR(job.workerEstimateAmount)}</strong>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                Final bill is based on the actual work completed and materials used. Generating this bill will issue an official invoice to the customer and update payment status to pending.
              </p>

              {/* Action Button */}
              <Button
                onClick={handleGenerateBill}
                disabled={isSubmitting || itemsSubtotal <= 0}
                className="w-full text-xs font-semibold py-3 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Receipt className="h-3.5 w-3.5 mr-1.5" />
                )}
                Generate Final Bill &amp; Invoice
              </Button>

              <div className="pt-2 border-t flex items-center text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                <span>Issued under {job.cooperativeName} standard trade contract.</span>
              </div>
            </CardContent>

            <CardFooter className="p-4 sm:p-5 border-t bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/worker/jobs/${job.id}`)}
                className="w-full text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Return to Active Job View
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
