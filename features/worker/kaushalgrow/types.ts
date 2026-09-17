export interface CourseChapter {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  videoPlaceholderText?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  duration: string; // e.g. "12:15"
  progress: number; // 0 - 100
  buttonText: string; // "Continue Learning" | "Start Learning"
  thumbnailGradient: string; // CSS background gradient or class
  iconName: string; // Lucide icon identifier
  description: string;
  rating?: number;
  level?: "Beginner" | "Intermediate" | "Advanced";
  chapters?: CourseChapter[];
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName: string;
  courseCount: number;
  softBg: string; // e.g., "bg-amber-500/10 text-amber-600"
  badgeColor?: string;
}

export interface LearningProgressStats {
  inProgress: number;
  completed: number;
  notStarted: number;
  overallProgressPercent: number;
}
