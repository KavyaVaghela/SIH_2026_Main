"use client";

import * as React from "react";
import { Clock, PlayCircle, Sun, Zap, Hammer, Paintbrush, Sparkles, Wrench, Scissors, Car, BookOpen } from "lucide-react";
import { Course } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface CourseCardProps {
  course: Course;
  onCourseClick: (course: Course) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Wrench,
  Scissors,
  Car,
};

export function CourseCard({ course, onCourseClick }: CourseCardProps) {
  const IconComponent = CATEGORY_ICON_MAP[course.iconName] || BookOpen;

  return (
    <Card className="group border border-border bg-card hover:border-emerald-500/40 hover:shadow-md transition-all rounded-xl overflow-hidden flex flex-col justify-between h-full">
      <CardContent className="p-0 flex flex-col justify-between h-full">
        {/* Course Thumbnail */}
        <div className={`relative h-40 w-full bg-gradient-to-br ${course.thumbnailGradient} p-4 flex flex-col justify-between text-white overflow-hidden`}>
          {/* Subtle Graphic Pattern */}
          <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
            <IconComponent className="h-32 w-32" />
          </div>

          <div className="flex items-center justify-between z-10">
            <Badge className="bg-black/40 hover:bg-black/60 text-white text-[10px] backdrop-blur-xs font-semibold border-none">
              {course.category}
            </Badge>

            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-[10px] text-white backdrop-blur-xs">
              <Clock className="h-3 w-3 text-amber-300" />
              <span>{course.duration}</span>
            </div>
          </div>

          <div className="z-10 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xs">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-white/80 uppercase font-mono tracking-wider font-semibold block">
                {course.level || "Skill Module"}
              </span>
              <span className="text-xs font-bold text-white line-clamp-1">
                {course.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
              {course.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Progress Indicator Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Progress:</span>
              <span className="font-bold text-foreground font-mono">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2 bg-muted" />
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onCourseClick(course)}
            className={`w-full text-xs font-semibold h-9 rounded-lg gap-2 ${
              course.progress > 0
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            <span>{course.buttonText}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
