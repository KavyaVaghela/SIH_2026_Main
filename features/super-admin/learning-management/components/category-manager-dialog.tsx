"use client";

import * as React from "react";
import { Grid, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { SkillCategory } from "@/features/shared/learning/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: SkillCategory[];
  onSaveCategory: (categoryData: Partial<SkillCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManagerDialog({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagerDialogProps) {
  const [editingCategory, setEditingCategory] = React.useState<SkillCategory | null>(null);
  const [name, setName] = React.useState("");
  const [iconName, setIconName] = React.useState("Sun");
  const [description, setDescription] = React.useState("");

  const handleStartEdit = (cat: SkillCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIconName(cat.iconName || "Sun");
    setDescription(cat.description || "");
  };

  const handleStartAdd = () => {
    setEditingCategory(null);
    setName("");
    setIconName("Sun");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCategory({
      ...(editingCategory?.id ? { id: editingCategory.id } : {}),
      name: name.trim(),
      iconName,
      description: description.trim(),
      softBg: editingCategory?.softBg || "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    });

    handleStartAdd();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Skill Categories Manager
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage vocational trade categories. Updates synchronize with Worker KaushalGrow filters.
          </DialogDescription>
        </DialogHeader>

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3 text-xs">
          <h4 className="font-bold text-foreground flex items-center justify-between">
            <span>{editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Skill Category"}</span>
            {editingCategory && (
              <button type="button" onClick={handleStartAdd} className="text-xs text-emerald-700 hover:underline">
                + Add New Instead
              </button>
            )}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Plumbing Services"
                className="h-9 text-xs bg-card"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Icon Identifier</label>
              <Input
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="Sun, Zap, Hammer, Wrench, Car..."
                className="h-9 text-xs bg-card"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Trade Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of trade skills..."
              className="h-9 text-xs bg-card"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button size="sm" type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 gap-1.5 px-4">
              <Save className="h-3.5 w-3.5" />
              <span>{editingCategory ? "Save Category" : "Add Category"}</span>
            </Button>
          </div>
        </form>

        {/* Categories List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Active Skill Categories ({categories.length})
          </h4>

          <div className="divide-y divide-border/60 border rounded-xl overflow-hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 bg-card hover:bg-muted/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] text-emerald-700 font-semibold">
                    {cat.courseCount} Courses
                  </Badge>
                  <div>
                    <span className="font-bold text-foreground block">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground">{cat.description || "No description"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleStartEdit(cat)}
                    className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteCategory(cat.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button size="sm" onClick={onClose} className="text-xs font-semibold px-5 h-9">
            Close Category Manager
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
