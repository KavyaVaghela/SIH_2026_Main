import { Course, SkillCategory, LearningProgressStats } from "./types";
import { SharedLearningStore } from "@/features/shared/learning/learning-store";

export const RAW_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "solar-energy",
    name: "Solar Energy",
    iconName: "Sun",
    courseCount: 0,
    softBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "electrical-safety",
    name: "Electrical Safety",
    iconName: "Zap",
    courseCount: 0,
    softBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/30",
  },
  {
    id: "carpentry",
    name: "Carpentry",
    iconName: "Hammer",
    courseCount: 0,
    softBg: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/30",
  },
  {
    id: "painting",
    name: "Painting",
    iconName: "Paintbrush",
    courseCount: 0,
    softBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/30",
  },
  {
    id: "cleaning",
    name: "Cleaning",
    iconName: "Sparkles",
    courseCount: 0,
    softBg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-500/30",
  },
  {
    id: "appliance-repair",
    name: "Appliance Repair",
    iconName: "Wrench",
    courseCount: 0,
    softBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "gardening",
    name: "Gardening",
    iconName: "Scissors",
    courseCount: 0,
    softBg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500/30",
  },
  {
    id: "driver-services",
    name: "Driver Services",
    iconName: "Car",
    courseCount: 0,
    softBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/30",
  },
];

export const RAW_MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    title: "Solar Panel Installation for Beginners",
    category: "Solar Energy",
    categoryId: "solar-energy",
    duration: "12:15",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-amber-600 to-orange-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Sun",
    description: "Learn basic roof mounting, solar cell wiring, inverter connection, and safety compliance for residential solar projects.",
    difficulty: "Beginner",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-15T12:00:00Z",
    chapters: [
      {
        id: "c1-1",
        title: "Introduction to PV Solar Cells",
        duration: "03:15",
        lessons: [
          { id: "l1-1", title: "Introduction to PV Solar Cells", duration: "03:15", isCompleted: true, videoPlaceholderText: "Understanding photovoltaic energy output and voltage safety standards." }
        ]
      },
      {
        id: "c1-2",
        title: "Roof Angle & Structural Mounting",
        duration: "04:00",
        lessons: [
          { id: "l1-2", title: "Roof Angle & Structural Mounting", duration: "04:00", isCompleted: true, videoPlaceholderText: "Proper installation of mounting rails and weatherproof flashing." }
        ]
      },
      {
        id: "c1-3",
        title: "DC to AC Wiring Connections",
        duration: "03:00",
        lessons: [
          { id: "l1-3", title: "DC to AC Wiring Connections", duration: "03:00", isCompleted: false, videoPlaceholderText: "Connecting micro-inverters and charge controllers safely." }
        ]
      },
      {
        id: "c1-4",
        title: "System Testing & Commissioning",
        duration: "02:00",
        lessons: [
          { id: "l1-4", title: "System Testing & Commissioning", duration: "02:00", isCompleted: false, videoPlaceholderText: "Verifying grid synchronization and grounding resistance." }
        ]
      },
    ],
  },
  {
    id: "course-2",
    title: "Electrical Safety Basics",
    category: "Electrical Safety",
    categoryId: "electrical-safety",
    duration: "10:20",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-blue-600 to-indigo-700",
    contentType: "VIDEO",
    status: "PUBLISHED",
    iconName: "Zap",
    description: "Essential hazard protection, Lockout/Tagout (LOTO) protocols, PPE guidelines, and grounding procedures for electricians.",
    difficulty: "Beginner",
    createdAt: "2026-09-02T10:00:00Z",
    updatedAt: "2026-09-14T09:00:00Z",
    chapters: [
      {
        id: "c2-1",
        title: "Understanding Electrical Shock Hazards",
        duration: "02:20",
        lessons: [
          { id: "l2-1", title: "Understanding Electrical Shock Hazards", duration: "02:20", isCompleted: true, videoPlaceholderText: "Current flow hazards, insulation resistance, and arc flash prevention." }
        ]
      },
    ],
  },
];

/**
 * Dynamically computes course count for each category matching actual courses array.
 */
export function computeCategoriesWithCounts(
  categories: SkillCategory[],
  courses: Course[]
): SkillCategory[] {
  return categories.map((cat) => {
    const count = courses.filter((c) => c.categoryId === cat.id).length;
    return { ...cat, courseCount: count };
  });
}

/**
 * Dynamically computes progress percent and button action text for a single course.
 */
export function computeCourseProgress(course: Course): Course {
  const chapters = course.chapters || [];
  let totalLessons = 0;
  let completedLessons = 0;

  chapters.forEach((ch) => {
    (ch.lessons || []).forEach((les) => {
      totalLessons++;
      if (les.isCompleted) completedLessons++;
    });
  });

  if (totalLessons === 0) {
    return { ...course, progress: 0, buttonText: "Start Learning" };
  }

  const progress = Math.round((completedLessons / totalLessons) * 100);
  const buttonText =
    progress === 100
      ? "Review Course"
      : progress > 0
      ? "Continue Learning"
      : "Start Learning";
  return { ...course, progress, buttonText };
}

/**
 * Dynamically computes overall dashboard statistics across all courses.
 */
export function computeLearningProgressStats(courses: Course[]): LearningProgressStats {
  const computedCourses = courses.map(computeCourseProgress);
  const completed = computedCourses.filter((c) => (c.progress ?? 0) === 100).length;
  const inProgress = computedCourses.filter((c) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;
  const notStarted = computedCourses.filter((c) => (c.progress ?? 0) === 0).length;

  const totalProgressSum = computedCourses.reduce((acc, c) => acc + (c.progress ?? 0), 0);
  const overallProgressPercent =
    computedCourses.length > 0 ? Math.round(totalProgressSum / computedCourses.length) : 0;

  return { completed, inProgress, notStarted, overallProgressPercent };
}

export const MOCK_COURSES: Course[] = RAW_MOCK_COURSES.map(computeCourseProgress);

export const MOCK_SKILL_CATEGORIES: SkillCategory[] = computeCategoriesWithCounts(
  RAW_SKILL_CATEGORIES,
  MOCK_COURSES
);

export const MOCK_PROGRESS_STATS: LearningProgressStats = computeLearningProgressStats(MOCK_COURSES);
