"use client";

import * as React from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Course, CourseChapter } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface CoursePlayerModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCourseProgress: (courseId: string, updatedChapters: CourseChapter[]) => void;
}

export function CoursePlayerModal({
  course,
  isOpen,
  onClose,
  onUpdateCourseProgress,
}: CoursePlayerModalProps) {
  if (!course) return null;

  const [chapters, setChapters] = React.useState<CourseChapter[]>(course.chapters || []);
  const [activeChapterIndex, setActiveChapterIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (course) {
      setChapters(course.chapters || []);
      setActiveChapterIndex(0);
      setIsPlaying(false);
    }
  }, [course]);

  const activeChapter = chapters[activeChapterIndex] || {
    id: "default-1",
    title: course.title,
    duration: course.duration,
    isCompleted: course.progress === 100,
    videoPlaceholderText: course.description,
  };

  const handleToggleChapterCompletion = (chapterIndex: number) => {
    const updated = chapters.map((chap, idx) => {
      if (idx === chapterIndex) {
        return { ...chap, isCompleted: !chap.isCompleted };
      }
      return chap;
    });
    setChapters(updated);
    onUpdateCourseProgress(course.id, updated);
  };

  const completedCount = chapters.filter((c) => c.isCompleted).length;
  const computedProgress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : course.progress;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border sm:rounded-2xl gap-0 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-700 text-white text-[10px] font-semibold">
                {course.category}
              </Badge>

              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {course.duration}
              </span>
            </div>

            <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {course.title}
            </DialogTitle>
          </div>
        </div>

        {/* Modal Body: Video Player + Chapter List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Left: Interactive Video Player Mockup */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between min-h-[280px] sm:min-h-[360px] text-white">
            {/* Video Screen Canvas */}
            <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
              <div className="p-4 rounded-full bg-emerald-600/30 border-2 border-emerald-500 text-emerald-400">
                {isPlaying ? <Pause className="h-8 w-8 animate-pulse" /> : <Play className="h-8 w-8 ml-1" />}
              </div>

              <div className="space-y-1 max-w-md">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                  Chapter {activeChapterIndex + 1} of {chapters.length || 1}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {activeChapter.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeChapter.videoPlaceholderText || "Interactive training module demonstration."}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`text-xs font-bold gap-2 px-5 h-9 rounded-full ${
                  isPlaying ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Pause Lesson
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Play Video
                  </>
                )}
              </Button>
            </div>

            {/* Video Control Bar */}
            <div className="pt-4 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Progress value={computedProgress} className="w-28 sm:w-36 h-2 bg-slate-800" />
                <span className="font-mono text-[11px] font-bold text-emerald-400">{computedProgress}% Completed</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleChapterCompletion(activeChapterIndex)}
                className={`text-xs h-8 border-slate-700 ${
                  activeChapter.isCompleted
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {activeChapter.isCompleted ? "Completed ✓" : "Mark Chapter Done"}
              </Button>
            </div>
          </div>

          {/* Right: Course Syllabus & Chapters List */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-l border-border bg-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  Course Lessons ({chapters.length})
                </h4>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {completedCount}/{chapters.length} Completed
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {chapters.map((chap, idx) => {
                  const isActive = idx === activeChapterIndex;
                  return (
                    <div
                      key={chap.id || idx}
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleChapterCompletion(idx);
                          }}
                          className={`mt-0.5 p-1 rounded-full shrink-0 ${
                            chap.isCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <div>
                          <h5 className="text-xs font-bold text-foreground leading-tight">
                            {idx + 1}. {chap.title}
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                            Duration: {chap.duration}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 border-t border-border/60 text-center space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Completing this course updates your worker skill dossier.
              </p>
              <Button size="sm" onClick={onClose} className="w-full text-xs font-semibold h-9">
                Close Player
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
