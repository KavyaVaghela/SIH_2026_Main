"use client";

import * as React from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  Video,
  ExternalLink,
  Download,
  X,
} from "lucide-react";
import { Course, CourseChapter } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface CoursePlayerModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleLessonCompletion: (courseId: string, lessonId: string, allLessonIds: string[]) => void;
}

export function CoursePlayerModal({
  course,
  isOpen,
  onClose,
  onToggleLessonCompletion,
}: CoursePlayerModalProps) {
  // Lock body scroll while modal is active
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const chapters = course?.chapters || [];

  // Extract all lesson IDs in course for progress calculation
  const allLessonIds: string[] = React.useMemo(() => {
    const list: string[] = [];
    chapters.forEach((ch) => {
      (ch.lessons || []).forEach((les) => list.push(les.id));
    });
    return list;
  }, [chapters]);

  // Track active chapter and lesson
  const [activeChapterIndex, setActiveChapterIndex] = React.useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (course) {
      setActiveChapterIndex(0);
      setActiveLessonIndex(0);
      setIsPlaying(false);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const activeChapter = chapters[activeChapterIndex] || {
    id: "def-ch",
    title: course.title,
    duration: course.duration,
    lessons: [
      {
        id: "def-les",
        title: course.title,
        duration: course.duration,
        videoPlaceholderText: course.description,
      },
    ],
  };

  const activeLesson = (activeChapter.lessons || [])[activeLessonIndex] || {
    id: "def-les",
    title: activeChapter.title,
    duration: activeChapter.duration,
    videoPlaceholderText: course.description,
  };

  // YouTube Embed URL Helper
  const getEmbedYoutubeUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1&rel=0`;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const youtubeEmbedUrl = getEmbedYoutubeUrl(course.youtubeUrl || activeLesson.videoUrl);

  const completedCount = allLessonIds.filter((lesId) => {
    for (const ch of chapters) {
      for (const les of ch.lessons || []) {
        if (les.id === lesId && les.isCompleted) return true;
      }
    }
    return false;
  }).length;

  const computedProgress = allLessonIds.length > 0 ? Math.round((completedCount / allLessonIds.length) * 100) : course.progress || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-xs animate-in fade-in-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Single Accessible Close Action */}
        <div className="p-3.5 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="space-y-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-700 text-white text-[10px] font-semibold shrink-0">
                {course.category}
              </Badge>

              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3 text-amber-500" />
                {course.duration}
              </span>
            </div>

            <h2 id="course-modal-title" className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-1">
              {course.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close course player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Video/PDF Player + Chapter List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 min-h-0">
          {/* Left: Video / PDF / Lesson Content Player Canvas */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between min-h-[320px] sm:min-h-[400px] text-white">
            {/* 1. YouTube Video Embed Player */}
            {course.contentType === "VIDEO" && youtubeEmbedUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-inner">
                <iframe
                  src={youtubeEmbedUrl}
                  title={course.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : course.contentType === "PDF" && course.pdfUrl ? (
              /* 2. PDF Resource View */
              <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-inner min-h-[240px]">
                <div className="p-3.5 sm:p-4 rounded-full bg-rose-600/30 border-2 border-rose-500 text-rose-400">
                  <FileText className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-1 max-w-md">
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block font-bold">
                    Official PDF Resource Guide
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">{course.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {course.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={course.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Open & Download PDF</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </div>
              </div>
            ) : (
              /* 3. Interactive Lesson Canvas */
              <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-inner min-h-[240px]">
                <div className="p-3.5 sm:p-4 rounded-full bg-emerald-600/30 border-2 border-emerald-500 text-emerald-400">
                  {isPlaying ? <Pause className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" /> : <Play className="h-7 w-7 sm:h-8 sm:w-8 ml-1" />}
                </div>

                <div className="space-y-1 max-w-md">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                    Chapter {activeChapterIndex + 1}, Lesson {activeLessonIndex + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {activeLesson.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {activeLesson.videoPlaceholderText || activeLesson.description || course.description}
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
                      <Play className="h-3.5 w-3.5" /> Play Lesson Demo
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Video Control & Completion Bar */}
            <div className="pt-3.5 sm:pt-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs text-slate-300 border-t border-slate-800/80 mt-4 shrink-0">
              <div className="flex items-center gap-2">
                <Progress value={computedProgress} className="w-24 sm:w-36 h-2 bg-slate-800 shrink-0" />
                <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">{computedProgress}% Completed</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleLessonCompletion(course.id, activeLesson.id, allLessonIds)}
                className={`text-xs h-8 border-slate-700 shrink-0 transition-colors ${
                  activeLesson.isCompleted
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900"
                    : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {activeLesson.isCompleted ? "Completed ✓" : "Mark Lesson Done"}
              </Button>
            </div>
          </div>

          {/* Right: Course Syllabus & Chapters List */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col justify-between">
            <div className="space-y-3 flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                  Course Content & Syllabus
                </h4>
                <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                  {completedCount}/{allLessonIds.length} Lessons
                </span>
              </div>

              {/* Chapters & Lessons Accordion */}
              <div className="space-y-3 max-h-[260px] sm:max-h-[320px] lg:max-h-[380px] overflow-y-auto pr-1">
                {chapters.map((chap, chIdx) => (
                  <div key={chap.id} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between px-1">
                      <span className="truncate pr-2">{chIdx + 1}. {chap.title}</span>
                      <span className="font-mono shrink-0">{chap.duration}</span>
                    </div>

                    <div className="space-y-1">
                      {(chap.lessons || []).map((les, lesIdx) => {
                        const isActive = chIdx === activeChapterIndex && lesIdx === activeLessonIndex;
                        return (
                          <div
                            key={les.id}
                            onClick={() => {
                              setActiveChapterIndex(chIdx);
                              setActiveLessonIndex(lesIdx);
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                              isActive
                                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-600 font-bold"
                                : "border-border bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLessonCompletion(course.id, les.id, allLessonIds);
                                }}
                                className={`p-0.5 rounded-full shrink-0 ${
                                  les.isCompleted
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-label={`Toggle lesson ${les.title} completion`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <span className="truncate">{les.title}</span>
                            </div>

                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                              {les.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice & Close Button */}
            <div className="pt-3 border-t border-border/60 text-center space-y-2 mt-4 shrink-0">
              <p className="text-[11px] text-muted-foreground">
                Progress updates in real-time & syncs with SuperAdmin analytics.
              </p>
              <Button size="sm" onClick={onClose} className="w-full text-xs font-semibold h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
                Close Player
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
