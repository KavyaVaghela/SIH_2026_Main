"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Video,
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { LearningResource, PublishStatus } from "@/features/shared/learning/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ResourceManagementTableProps {
  resources: LearningResource[];
  onAddResource: () => void;
  onEditResource: (resource: LearningResource) => void;
  onDeleteResource: (resourceId: string, title: string) => void;
  onTogglePublishStatus: (resourceId: string, currentStatus: PublishStatus) => void;
}

export function ResourceManagementTable({
  resources,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onTogglePublishStatus,
}: ResourceManagementTableProps) {
  const [showAll, setShowAll] = React.useState(false);

  const displayedResources = showAll ? resources : resources.slice(0, 6);

  return (
    <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Learning Resources Management
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage course titles, video/PDF links, content types, and publish statuses for Worker KaushalGrow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onAddResource}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 gap-1.5 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Resource</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Resource Title</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {displayedResources.map((res) => (
              <tr key={res.id} className="hover:bg-muted/40 transition-colors">
                {/* Title */}
                <td className="py-3.5 px-3 max-w-[240px]">
                  <div className="font-bold text-foreground line-clamp-1">{res.title}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {res.description}
                  </div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                    {res.category}
                  </Badge>
                </td>

                {/* Type */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    {res.contentType === "VIDEO" && <Video className="h-3.5 w-3.5 text-blue-600" />}
                    {res.contentType === "PDF" && <FileText className="h-3.5 w-3.5 text-rose-600" />}
                    {res.contentType === "CHAPTERS" && <BookOpen className="h-3.5 w-3.5 text-emerald-600" />}
                    <span>{res.contentType}</span>
                  </div>
                </td>

                {/* Duration */}
                <td className="py-3.5 px-3 whitespace-nowrap font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    {res.duration}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  {res.status === "PUBLISHED" && (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold">
                      PUBLISHED
                    </Badge>
                  )}
                  {res.status === "DRAFT" && (
                    <Badge variant="secondary" className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      DRAFT
                    </Badge>
                  )}
                  {res.status === "UNPUBLISHED" && (
                    <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-400">
                      UNPUBLISHED
                    </Badge>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-1">
                  {/* Publish/Unpublish Toggle */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      onTogglePublishStatus(
                        res.id,
                        res.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED"
                      )
                    }
                    title={res.status === "PUBLISHED" ? "Unpublish resource" : "Publish resource"}
                    className="h-7 w-7 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    {res.status === "PUBLISHED" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                  </Button>

                  {/* Edit */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEditResource(res)}
                    title="Edit resource"
                    className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteResource(res.id, res.title)}
                    title="Delete resource"
                    className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer View All Toggle */}
      {resources.length > 6 && (
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Showing {displayedResources.length} of {resources.length} resources
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-emerald-700 font-semibold h-7"
          >
            {showAll ? "Show Less" : "View All Resources"}
          </Button>
        </div>
      )}
    </Card>
  );
}
