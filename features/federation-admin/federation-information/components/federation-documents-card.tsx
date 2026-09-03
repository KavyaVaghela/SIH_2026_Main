"use client";

import * as React from "react";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  FileEdit,
  FolderOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedFieldBadge } from "./protected-field-badge";
import type { FederationDocumentItem, ChangeRequestField } from "../types";

interface FederationDocumentsCardProps {
  documents: FederationDocumentItem[];
  onRequestChange: (field: ChangeRequestField) => void;
}

export function FederationDocumentsCard({
  documents,
  onRequestChange,
}: FederationDocumentsCardProps) {
  const [previewDoc, setPreviewDoc] = React.useState<FederationDocumentItem | null>(null);

  const getCategoryBadge = (category: FederationDocumentItem["category"]) => {
    switch (category) {
      case "REGISTRATION":
        return <Badge variant="outline" className="text-[10px] border-emerald-600/30 text-emerald-800 dark:text-emerald-300">Registration</Badge>;
      case "GOVERNANCE_CHARTER":
        return <Badge variant="outline" className="text-[10px] border-purple-600/30 text-purple-800 dark:text-purple-300">Governance</Badge>;
      case "TAX_COMPLIANCE":
        return <Badge variant="outline" className="text-[10px] border-blue-600/30 text-blue-800 dark:text-blue-300">Fiscal / Tax</Badge>;
      case "AUDIT_REPORT":
        return <Badge variant="outline" className="text-[10px] border-amber-600/30 text-amber-800 dark:text-amber-300">Statutory Audit</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">General</Badge>;
    }
  };

  const getStatusBadge = (status: FederationDocumentItem["status"]) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified & Valid
          </span>
        );
      case "PENDING_AUDIT":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Under Verification
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Renewal Required
          </span>
        );
    }
  };

  const handleSimulatedDownload = (doc: FederationDocumentItem) => {
    // Graceful in-browser notification simulation
    alert(`Document Download: Initiating certified copy download for "${doc.name}" (${doc.fileType})`);
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Registration & Official Compliance Documents
                </CardTitle>
                <ProtectedFieldBadge label="Audited Repository" />
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Official certificates, bylaws, and compliance filings verified with the cooperative registrar
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestChange("officialDocuments")}
            className="h-8 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 self-start sm:self-auto"
          >
            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
            Request Document Update
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {documents.length === 0 ? (
          // Professional Empty State
          <div className="text-center py-10 px-4 border border-dashed border-border/80 rounded-lg bg-muted/20 space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              No Official Documents Uploaded
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Statutory documents have not yet been synchronized from the State Registrar repository. You can submit a change request to append certified documents.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestChange("officialDocuments")}
              className="text-xs"
            >
              <FileEdit className="h-3.5 w-3.5 mr-1.5" />
              Submit Official Document Request
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {getCategoryBadge(doc.category)}
                    {getStatusBadge(doc.status)}
                  </div>

                  <h4 className="text-xs font-semibold text-foreground leading-snug group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                    {doc.name}
                  </h4>

                  <div className="flex items-center space-x-2 text-[10px] text-muted-foreground font-mono">
                    <span>{doc.fileType}</span>
                    {doc.fileSize && (
                      <>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                      </>
                    )}
                    {doc.issueDate && (
                      <>
                        <span>•</span>
                        <span>Issued: {doc.issueDate}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    Digitally Sealed & Encrypted
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulatedDownload(doc)}
                      className="h-7 px-2 text-[11px] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
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

        {/* Document Preview Modal (if triggered) */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
            <div className="relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Document Metadata Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">{previewDoc.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                  className="h-7 w-7 p-0"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Document Identifier:</span>
                  <span className="font-mono text-foreground">{previewDoc.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-foreground">{previewDoc.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Format & Size:</span>
                  <span className="text-foreground">{previewDoc.fileType} ({previewDoc.fileSize || "N/A"})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Issued Date:</span>
                  <span className="text-foreground">{previewDoc.issueDate || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Verification State:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{previewDoc.status}</span>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded text-[11px] text-muted-foreground flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Certificate authenticated with Gujarat Registrar Public Key Infrastructure (PKI).</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
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
                    handleSimulatedDownload(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="text-xs bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Certified Copy
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
