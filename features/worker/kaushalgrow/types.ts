import {
  LearningResource,
  SkillCategory as SharedSkillCategory,
  CourseChapter as SharedCourseChapter,
  Lesson,
} from "@/features/shared/learning/types";

export type Course = LearningResource;
export type CourseChapter = SharedCourseChapter;
export type { Lesson };

export interface SkillCategory extends SharedSkillCategory {
  badgeColor?: string;
}

export interface LearningProgressStats {
  inProgress: number;
  completed: number;
  notStarted: number;
  overallProgressPercent: number;
}
