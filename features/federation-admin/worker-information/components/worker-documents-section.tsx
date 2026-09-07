"use client";

import * as React from "react";
import { FileText, Download, Eye, CheckCircle2, Clock, FolderOpen, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkerDocumentItem } from "../types";

interface WorkerDocumentsSectionProps {
  documents: WorkerDocumentItem[];
}

export function WorkerDocumentsSection({ documents }: WorkerDocumentsSectionProps) {
  const [previewDoc, setPreviewDoc] = React.useState<WorkerDocumentItem | null>(null);

  const getCategoryBadge = (category: WorkerDocumentItem["category"]) => {
    switch (category) {
      case "IDENTITY":
        return <Badge variant="outline" className="text-[10px] border-blue-600/30 text-blue-800 dark:text-blue-300">Identity KYC</Badge>;
      case "TRADE_CERTIFICATE":
        return <Badge variant="outline" className="text-[10px] border-emerald-600/30 text-emerald-800 dark:text-emerald-300">Trade License</Badge>;
      case "POLICE_CLEARANCE":
        return <Badge variant="outline" className="text-[10px] border-purple-600/30 text-purple-800 dark:text-purple-300">Background Verification</Badge>;
      case "INSURANCE":
        return <Badge variant="outline" className="text-[10px] border-amber-600/30 text-amber-800 dark:text-amber-300">Welfare Insurance</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">General</Badge>;
    }
  };

  const handleDownload = (doc: WorkerDocumentItem) => {
    alert(`Document Download: Initiating certified copy download for "${doc.name}"`);
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Official Identity & KYC Documents
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Government identity proofs, background clearances, and cooperative trade records
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {documents.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-border/80 rounded-lg bg-muted/20 space-y-2">
            <FolderOpen className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No official documents are currently uploaded to this member's repository.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/15 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    {getCategoryBadge(doc.category)}
                    <span className="inline-flex items-center text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                      Verified
                    </span>
                  </div>

                  <h4 className="font-semibold text-foreground text-xs leading-snug">
                    {doc.name}
                  </h4>

                  <div className="text-[10px] text-muted-foreground font-mono">
                    <span>{doc.fileType}</span>
                    {doc.fileSize && <span> • {doc.fileSize}</span>}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    {doc.issueDate ? `Verified: ${doc.issueDate}` : "Active"}
                  </span>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-6 px-2 text-[11px] text-emerald-800 dark:text-emerald-300"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal preview */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
            <div className="relative w-full max-w-md rounded-lg border bg-card p-5 shadow-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-semibold text-foreground">{previewDoc.name}</h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Document ID:</span>
                  <span className="font-mono text-foreground">{previewDoc.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-foreground">{previewDoc.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Type & Size:</span>
                  <span className="text-foreground">{previewDoc.fileType} ({previewDoc.fileSize || "N/A"})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-emerald-700 font-semibold">{previewDoc.status}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleDownload(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
