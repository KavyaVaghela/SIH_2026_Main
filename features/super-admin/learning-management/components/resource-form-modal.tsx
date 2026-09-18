"use client";

import * as React from "react";
import {
  X,
  Plus,
  Trash2,
  Video,
  FileText,
  BookOpen,
  Save,
} from "lucide-react";
import {
  LearningResource,
  PublishStatus,
  ContentType,
  DifficultyLevel,
  SkillCategory,
  CourseChapter,
  Lesson,
} from "@/features/shared/learning/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveResource: (resourceData: Partial<LearningResource>) => void;
  initialData?: LearningResource | null;
  categories: SkillCategory[];
}

export function ResourceFormModal({
  isOpen,
  onClose,
  onSaveResource,
  initialData,
  categories,
}: ResourceFormModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>("Beginner");
  const [duration, setDuration] = React.useState("10:00");
  const [contentType, setContentType] = React.useState<ContentType>("CHAPTERS");
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [status, setStatus] = React.useState<PublishStatus>("DRAFT");
  const [learningObjectives, setLearningObjectives] = React.useState<string[]>([]);
  const [newObjective, setNewObjective] = React.useState("");

  const [chapters, setChapters] = React.useState<CourseChapter[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategoryId(initialData.categoryId || (categories[0]?.id || "solar-energy"));
      setDifficulty(initialData.difficulty || "Beginner");
      setDuration(initialData.duration || "10:00");
      setContentType(initialData.contentType || "CHAPTERS");
      setYoutubeUrl(initialData.youtubeUrl || "");
      setPdfUrl(initialData.pdfUrl || "");
      setStatus(initialData.status || "DRAFT");
      setLearningObjectives(initialData.learningObjectives || []);
      setChapters(initialData.chapters || []);
    } else {
      setTitle("");
      setDescription("");
      setCategoryId(categories[0]?.id || "solar-energy");
      setDifficulty("Beginner");
      setDuration("10:00");
      setContentType("CHAPTERS");
      setYoutubeUrl("");
      setPdfUrl("");
      setStatus("DRAFT");
      setLearningObjectives([]);
      setChapters([
        {
          id: `ch-${Date.now()}`,
          title: "Chapter 1: Foundations",
          duration: "10:00",
          lessons: [
            {
              id: `les-${Date.now()}`,
              title: "Lesson 1: Introduction",
              duration: "10:00",
              videoPlaceholderText: "Overview lesson for trade safety and protocol.",
            },
          ],
        },
      ]);
    }
    setErrors({});
  }, [initialData, categories, isOpen]);

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setLearningObjectives([...learningObjectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const handleAddChapter = () => {
    const chNum = chapters.length + 1;
    const newCh: CourseChapter = {
      id: `ch-${Date.now()}-${chNum}`,
      title: `Chapter ${chNum}: New Topic`,
      duration: "05:00",
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: `Lesson 1`,
          duration: "05:00",
          videoPlaceholderText: "Lesson description",
        },
      ],
    };
    setChapters([...chapters, newCh]);
  };

  const handleRemoveChapter = (chapterId: string) => {
    setChapters(chapters.filter((c) => c.id !== chapterId));
  };

  const handleAddLesson = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          const lesNum = ch.lessons.length + 1;
          const newLes: Lesson = {
            id: `les-${Date.now()}-${lesNum}`,
            title: `Lesson ${lesNum}`,
            duration: "03:00",
            videoPlaceholderText: "Lesson details and practical instructions.",
          };
          return { ...ch, lessons: [...ch.lessons, newLes] };
        }
        return ch;
      })
    );
  };

  const handleRemoveLesson = (chapterId: string, lessonId: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          return { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) };
        }
        return ch;
      })
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Course title is required";
    if (!description.trim()) errs.description = "Course description is required";
    if (!categoryId) errs.category = "Category is required";

    if (contentType === "VIDEO" && youtubeUrl && !youtubeUrl.startsWith("http")) {
      errs.youtubeUrl = "Please provide a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)";
    }

    if (contentType === "PDF" && pdfUrl && !pdfUrl.startsWith("http")) {
      errs.pdfUrl = "Please provide a valid URL for the PDF resource";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCat = categories.find((c) => c.id === categoryId);

    const payload: Partial<LearningResource> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category: selectedCat ? selectedCat.name : "Solar Energy",
      categoryId: categoryId,
      difficulty,
      duration: duration.trim() || "10:00",
      contentType,
      youtubeUrl: contentType === "VIDEO" ? youtubeUrl.trim() : undefined,
      pdfUrl: contentType === "PDF" ? pdfUrl.trim() : undefined,
      status,
      iconName: selectedCat ? selectedCat.iconName : "Sun",
      learningObjectives,
      chapters,
    };

    onSaveResource(payload);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border sm:rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <DialogTitle className="text-lg font-bold text-foreground">
            {initialData ? "Edit Learning Resource" : "Create New Learning Resource"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure learning material for SuperAdmin publishing to Worker KaushalGrow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              1. Basic Course Details
            </h4>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Course Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solar Panel Installation & Wiring"
                className="h-10 text-xs"
              />
              {errors.title && <p className="text-[11px] text-rose-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Description *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the trade skills and practical learning outcomes..."
                rows={3}
                className="text-xs"
              />
              {errors.description && <p className="text-[11px] text-rose-600">{errors.description}</p>}
            </div>

            {/* Category & Difficulty & Duration & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Category *</label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-9 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Difficulty</label>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="h-9 text-xs"
                >
                  <option value="Beginner" className="text-xs">Beginner</option>
                  <option value="Intermediate" className="text-xs">Intermediate</option>
                  <option value="Advanced" className="text-xs">Advanced</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Duration (mm:ss)</label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="12:15"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Publish Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PublishStatus)}
                  className="h-9 text-xs font-semibold"
                >
                  <option value="DRAFT" className="text-xs font-bold text-amber-600">DRAFT (Hidden)</option>
                  <option value="PUBLISHED" className="text-xs font-bold text-emerald-600">PUBLISHED (Live)</option>
                  <option value="UNPUBLISHED" className="text-xs font-bold text-slate-500">UNPUBLISHED</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Content Type & Delivery */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              2. Learning Content Type & Links
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setContentType("CHAPTERS")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-semibold cursor-pointer ${
                  contentType === "CHAPTERS"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span>Chapter-Based</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType("VIDEO")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-semibold cursor-pointer ${
                  contentType === "VIDEO"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <Video className="h-5 w-5 text-blue-600" />
                <span>YouTube Video</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType("PDF")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 text-xs font-semibold cursor-pointer ${
                  contentType === "PDF"
                    ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <FileText className="h-5 w-5 text-rose-600" />
                <span>PDF Guide</span>
              </button>
            </div>

            {contentType === "VIDEO" && (
              <div className="space-y-1 p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200">
                <label className="font-semibold text-foreground">YouTube Video URL</label>
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-9 text-xs bg-card"
                />
                {errors.youtubeUrl && <p className="text-[11px] text-rose-600">{errors.youtubeUrl}</p>}
                <p className="text-[10px] text-muted-foreground">
                  Workers will be able to watch this YouTube video embedded inside the KaushalGrow course player.
                </p>
              </div>
            )}

            {contentType === "PDF" && (
              <div className="space-y-1 p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200">
                <label className="font-semibold text-foreground">PDF Document URL</label>
                <Input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/resources/solar-manual.pdf"
                  className="h-9 text-xs bg-card"
                />
                {errors.pdfUrl && <p className="text-[11px] text-rose-600">{errors.pdfUrl}</p>}
                <p className="text-[10px] text-muted-foreground">
                  Workers will be able to view and download this PDF document inside KaushalGrow.
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Learning Objectives */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              3. Learning Objectives
            </h4>

            <div className="flex items-center gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add a key learning outcome (e.g. Master panel wiring standard)"
                className="h-9 text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddObjective}
                className="h-9 text-xs px-3 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {learningObjectives.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {learningObjectives.map((obj, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px] py-1 px-2.5 gap-1.5">
                    <span>✓ {obj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(i)}
                      className="hover:text-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Chapters & Lessons Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                4. Chapters & Lessons Builder ({chapters.length} Chapters)
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChapter}
                className="h-7 text-xs text-emerald-700 border-emerald-600/30"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Chapter
              </Button>
            </div>

            <div className="space-y-3">
              {chapters.map((ch) => (
                <div key={ch.id} className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={ch.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChapters((prev) =>
                          prev.map((c) => (c.id === ch.id ? { ...c, title: val } : c))
                        );
                      }}
                      className="h-8 text-xs font-bold bg-card"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChapter(ch.id)}
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Lessons list inside chapter */}
                  <div className="space-y-2 pl-3 border-l-2 border-emerald-500/30">
                    {(ch.lessons || []).map((les, lesIdx) => (
                      <div key={les.id} className="flex items-center gap-2">
                        <Input
                          value={les.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChapters((prev) =>
                              prev.map((c) => {
                                if (c.id === ch.id) {
                                  return {
                                    ...c,
                                    lessons: (c.lessons || []).map((l) =>
                                      l.id === les.id ? { ...l, title: val } : l
                                    ),
                                  };
                                }
                                return c;
                              })
                            );
                          }}
                          placeholder={`Lesson ${lesIdx + 1} title`}
                          className="h-8 text-xs bg-card"
                        />
                        <Input
                          value={les.duration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChapters((prev) =>
                              prev.map((c) => {
                                if (c.id === ch.id) {
                                  return {
                                    ...c,
                                    lessons: (c.lessons || []).map((l) =>
                                      l.id === les.id ? { ...l, duration: val } : l
                                    ),
                                  };
                                }
                                return c;
                              })
                            );
                          }}
                          placeholder="03:00"
                          className="h-8 text-xs w-20 bg-card font-mono"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLesson(ch.id, les.id)}
                          className="h-8 w-8 text-slate-500 hover:text-rose-600 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddLesson(ch.id)}
                      className="text-[11px] text-emerald-700 h-6 px-2"
                    >
                      + Add Lesson
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Controls */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-9 text-xs gap-1.5 px-5">
              <Save className="h-4 w-4" />
              <span>{initialData ? "Save Changes" : "Create Resource"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
