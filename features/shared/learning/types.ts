export type PublishStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type ContentType = "VIDEO" | "PDF" | "CHAPTERS";
export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
  videoPlaceholderText?: string;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface CourseChapter {
  id: string;
  title: string;
  duration: string;
  lessons: Lesson[];
  isCompleted?: boolean;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName: string;
  courseCount: number;
  softBg: string;
  description?: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  difficulty: DifficultyLevel;
  duration: string; // e.g. "12:15"
  thumbnailGradient?: string;
  thumbnailUrl?: string;
  contentType: ContentType;
  youtubeUrl?: string;
  pdfUrl?: string;
  status: PublishStatus;
  iconName: string;
  learningObjectives?: string[];
  chapters: CourseChapter[];
  createdAt: string;
  updatedAt: string;
  // Computed fields for display
  progress?: number;
  buttonText?: string;
}

export interface WorkerProgressRecord {
  workerId: string;
  resourceId: string;
  completedLessonIds: string[];
  totalLessons: number;
  progressPercent: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  lastUpdated: string;
}

export interface LMSDashboardStats {
  registeredWorkersCount: number;
  totalCategoriesCount: number;
  totalResourcesCount: number;
  publishedResourcesCount: number;
  draftResourcesCount: number;
  overallCompletionPercent: number;
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  notStartedCoursesCount: number;
}
