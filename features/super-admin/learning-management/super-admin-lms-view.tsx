"use client";

import * as React from "react";
import {
  Plus,
  Grid,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { SharedLearningStore } from "@/features/shared/learning/learning-store";
import {
  LearningResource,
  SkillCategory,
  PublishStatus,
  LMSDashboardStats,
} from "@/features/shared/learning/types";

import { LMSWelcomeBanner } from "./components/welcome-banner";
import { LMSSummaryCards } from "./components/lms-summary-cards";
import { ResourceManagementTable } from "./components/resource-management-table";
import { ResourceFormModal } from "./components/resource-form-modal";
import { WorkersProgressPanel } from "./components/workers-progress-panel";
import { CategoryManagerDialog } from "./components/category-manager-dialog";

export function SuperAdminLMSView() {
  const [resources, setResources] = React.useState<LearningResource[]>([]);
  const [categories, setCategories] = React.useState<SkillCategory[]>([]);
  const [stats, setStats] = React.useState<LMSDashboardStats>({
    registeredWorkersCount: 142,
    totalCategoriesCount: 8,
    totalResourcesCount: 7,
    publishedResourcesCount: 6,
    draftResourcesCount: 1,
    overallCompletionPercent: 0,
    completedCoursesCount: 0,
    inProgressCoursesCount: 0,
    notStartedCoursesCount: 7,
  });

  const [isResourceModalOpen, setIsResourceModalOpen] = React.useState(false);
  const [editingResource, setEditingResource] = React.useState<LearningResource | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);

  // Subscribe to SharedLearningStore changes (synced with Worker KaushalGrow in real time)
  const refreshStoreData = React.useCallback(() => {
    const resList = SharedLearningStore.getResources();
    const catList = SharedLearningStore.getCategories();
    const lmsStats = SharedLearningStore.getLMSDashboardStats();

    setResources(resList);
    setCategories(catList);
    setStats(lmsStats);
  }, []);

  React.useEffect(() => {
    refreshStoreData();
    const unsubscribe = SharedLearningStore.subscribe(() => {
      refreshStoreData();
    });
    return () => unsubscribe();
  }, [refreshStoreData]);

  // Handlers
  const handleOpenAddResource = () => {
    setEditingResource(null);
    setIsResourceModalOpen(true);
  };

  const handleOpenEditResource = (resource: LearningResource) => {
    setEditingResource(resource);
    setIsResourceModalOpen(true);
  };

  const handleDeleteResource = (resourceId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? Historical worker records will be preserved.`)) {
      SharedLearningStore.deleteResource(resourceId);
    }
  };

  const handleTogglePublishStatus = (resourceId: string, currentStatus: PublishStatus) => {
    SharedLearningStore.setPublishStatus(resourceId, currentStatus);
  };

  const handleSaveResource = (resourceData: Partial<LearningResource>) => {
    SharedLearningStore.saveResource(resourceData);
  };

  const handleSaveCategory = (categoryData: Partial<SkillCategory>) => {
    SharedLearningStore.saveCategory(categoryData);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category? Associated courses will be safely reassigned.")) {
      SharedLearningStore.deleteCategory(categoryId);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
      {/* 1. Welcome Banner */}
      <LMSWelcomeBanner />

      {/* 3. Summary Cards */}
      <LMSSummaryCards stats={stats} />

      {/* 4. Main Resource Management Table */}
      <ResourceManagementTable
        resources={resources}
        onAddResource={handleOpenAddResource}
        onEditResource={handleOpenEditResource}
        onDeleteResource={handleDeleteResource}
        onTogglePublishStatus={handleTogglePublishStatus}
      />

      {/* 5. Workers' Learning Progress Panel */}
      <WorkersProgressPanel stats={stats} />

      {/* 6. Two Column Grid: Popular Skill Categories & Quick Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left: Popular Skill Categories */}
        <Card className="lg:col-span-7 border border-border bg-card shadow-xs rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Popular Skill Categories
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-xs text-emerald-700 font-semibold h-7"
            >
              <span>View All ({categories.length})</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <div
                key={cat.id}
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-3 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:bg-accent/40 transition-all text-center space-y-1.5 cursor-pointer"
              >
                <span className="text-xs font-bold text-foreground block truncate">
                  {cat.name}
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700">
                  {cat.courseCount} Published
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Quick Management Cards */}
        <Card className="lg:col-span-5 border border-border bg-card shadow-xs rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base font-bold text-foreground">
              Quick Management Controls
            </CardTitle>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenAddResource}
              className="w-full p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 text-left flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Add Learning Resource</span>
                  <span className="text-[10px] text-muted-foreground">Publish video, PDF, or chapter course</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full p-3.5 rounded-xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-500 text-left flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Grid className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Manage Skill Categories</span>
                  <span className="text-[10px] text-muted-foreground">Add, edit, or reorganize trade domains</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        </Card>
      </div>

      {/* Add / Edit Resource Modal */}
      <ResourceFormModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSaveResource={handleSaveResource}
        initialData={editingResource}
        categories={categories}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}
