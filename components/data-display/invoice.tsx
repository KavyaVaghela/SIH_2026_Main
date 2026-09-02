import * as React from "react";
import { Building2, FileText, Download } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/status/status-badge";
import { formatINR } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  cooperativeName: string;
  cooperativeGst?: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  status: "paid" | "unpaid" | "overdue";
  onDownload?: () => void;
  className?: string;
}

export function Invoice({
  invoiceNumber,
  issueDate,
  dueDate,
  cooperativeName,
  cooperativeGst,
  customerName,
  customerAddress,
  items,
  subtotal,
  platformFee,
  taxAmount,
  totalAmount,
  status,
  onDownload,
  className,
}: InvoiceProps) {
  return (
    <Card className={cn("max-w-3xl mx-auto border shadow-sm", className)}>
      <CardHeader className="p-6 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{cooperativeName}</h2>
            </div>
            {cooperativeGst && (
              <p className="text-xs text-muted-foreground mt-0.5">GSTIN: {cooperativeGst}</p>
            )}
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="flex items-center space-x-2 justify-start sm:justify-end">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold uppercase">{invoiceNumber}</span>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-muted-foreground">Issued: {issueDate} • Due: {dueDate}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="rounded-md bg-muted/40 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Billed To</h4>
          <p className="font-semibold text-sm text-foreground">{customerName}</p>
          <p className="text-xs text-muted-foreground">{customerAddress}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Description</TableHead>
              <TableHead className="text-center">Qty/Hrs</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatINR(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatINR(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-64 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cooperative Platform Fee</span>
              <span className="font-medium text-foreground">{formatINR(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (Taxes)</span>
              <span className="font-medium text-foreground">{formatINR(taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t text-sm font-bold text-foreground">
              <span>Total Payable</span>
              <span className="text-primary">{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {onDownload && (
        <CardFooter className="p-4 border-t bg-muted/10 flex justify-end">
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Invoice
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
