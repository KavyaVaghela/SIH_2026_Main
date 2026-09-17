"use client";

import * as React from "react";
import { Filter, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  MOCK_COURSES,
  RAW_SKILL_CATEGORIES,
  computeCategoriesWithCounts,
  computeCourseProgress,
  computeLearningProgressStats,
} from "./mock-data";
import { Course, CourseChapter } from "./types";

import { KaushalGrowHeroBanner } from "./components/hero-banner";
import { SearchFilterBar } from "./components/search-filter-bar";
import { KaushalGrowStatsSummaryCards } from "./components/stats-summary-cards";
import { SkillCategoriesGrid } from "./components/skill-categories-grid";
import { CourseCard } from "./components/course-card";
import { ProgressDashboardCard } from "./components/progress-dashboard-card";
import { CoursePlayerModal } from "./components/course-player-modal";
import { ViewAllCategoriesModal } from "./components/view-all-categories-modal";

const LOCAL_STORAGE_KEY = "kaushalgrow_courses_v2";

export function KaushalGrowView() {
  const [courses, setCourses] = React.useState<Course[]>(MOCK_COURSES);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = React.useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = React.useState(false);

  // Load persisted course progress on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: Course[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed.map(computeCourseProgress));
        }
      }
    } catch (err) {
      console.warn("Failed to load KaushalGrow progress from localStorage:", err);
    }
  }, []);

  // Dynamically compute category course counts based on actual courses array
  const categories = React.useMemo(() => {
    return computeCategoriesWithCounts(RAW_SKILL_CATEGORIES, courses);
  }, [courses]);

  // Dynamically calculate overall progress stats across all courses
  const stats = React.useMemo(() => {
    return computeLearningProgressStats(courses);
  }, [courses]);

  // Filter courses based on search query and category selection
  const filteredCourses = React.useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !activeCategoryId || course.categoryId === activeCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, activeCategoryId]);

  const handleOpenCoursePlayer = (course: Course) => {
    setSelectedCourse(course);
    setIsPlayerOpen(true);
  };

  const handleUpdateCourseProgress = (courseId: string, updatedChapters: CourseChapter[]) => {
    setCourses((prevCourses) => {
      const updatedList = prevCourses.map((c) => {
        if (c.id === courseId) {
          const updatedCourse: Course = {
            ...c,
            chapters: updatedChapters,
          };
          return computeCourseProgress(updatedCourse);
        }
        return c;
      });

      // Save updated course state to localStorage for persistence
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Failed to save KaushalGrow progress to localStorage:", err);
      }

      return updatedList;
    });

    // Update selected course reference for active modal
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse((prev) => {
        if (!prev) return null;
        return computeCourseProgress({ ...prev, chapters: updatedChapters });
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1500px] mx-auto pb-16">
      {/* Hero Banner */}
      <KaushalGrowHeroBanner />

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategoryId={activeCategoryId}
        onFilterClick={() => setIsCategoriesModalOpen(true)}
      />

      {/* Learning Statistics Summary Cards */}
      <KaushalGrowStatsSummaryCards
        inProgressCount={stats.inProgress}
        completedCount={stats.completed}
      />

      {/* Skill Categories Grid (Dynamic Course Counts) */}
      <SkillCategoriesGrid
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        onViewAllClick={() => setIsCategoriesModalOpen(true)}
      />

      {/* Active Filter Indicator */}
      {(activeCategoryId || searchQuery) && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>
              Showing results for{" "}
              {activeCategoryId && (
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {categories.find((c) => c.id === activeCategoryId)?.name}
                </strong>
              )}
              {activeCategoryId && searchQuery && " and "}
              {searchQuery && <strong>&ldquo;{searchQuery}&rdquo;</strong>}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setActiveCategoryId(null);
            }}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold h-7"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Continue Learning Course Cards */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Continue Learning
            </h2>
            <p className="text-xs text-muted-foreground">
              Pick up where you left off or start a new skill module
            </p>
          </div>

          <Badge variant="outline" className="text-xs text-emerald-700 font-semibold">
            {filteredCourses.length} Courses
          </Badge>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onCourseClick={handleOpenCoursePlayer}
              />
            ))}
          </div>
        ) : (
          /* Empty Search Filter State */
          <Card className="p-10 text-center border-dashed space-y-3 w-full">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No matching courses found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any learning modules matching your query &ldquo;{searchQuery}&rdquo;. Try clearing filters or searching for electrical, solar, carpentry, or painting topics.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveCategoryId(null);
              }}
              className="mt-2 text-xs"
            >
              Reset Search & Filters
            </Button>
          </Card>
        )}
      </div>

      {/* My Learning Progress Section */}
      <div className="pt-2">
        <ProgressDashboardCard stats={stats} />
      </div>

      {/* Interactive Course Player Modal */}
      <CoursePlayerModal
        course={selectedCourse}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onUpdateCourseProgress={handleUpdateCourseProgress}
      />

      {/* View All Categories Modal */}
      <ViewAllCategoriesModal
        categories={categories}
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />
    </div>
  );
}
