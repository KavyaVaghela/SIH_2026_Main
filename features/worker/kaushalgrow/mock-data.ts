import { Course, SkillCategory, LearningProgressStats } from "./types";

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

const RAW_MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    title: "Solar Panel Installation for Beginners",
    category: "Solar Energy",
    categoryId: "solar-energy",
    duration: "12:15",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-amber-600 to-orange-700",
    iconName: "Sun",
    description: "Learn basic roof mounting, solar cell wiring, inverter connection, and safety compliance for residential solar projects.",
    level: "Beginner",
    chapters: [
      { id: "c1-1", title: "Introduction to PV Solar Cells", duration: "03:15", isCompleted: true, videoPlaceholderText: "Understanding photovoltaic energy output and voltage safety standards." },
      { id: "c1-2", title: "Roof Angle & Structural Mounting", duration: "04:00", isCompleted: true, videoPlaceholderText: "Proper installation of mounting rails and weatherproof flashing." },
      { id: "c1-3", title: "DC to AC Wiring Connections", duration: "03:00", isCompleted: false, videoPlaceholderText: "Connecting micro-inverters and charge controllers safely." },
      { id: "c1-4", title: "System Testing & Commissioning", duration: "02:00", isCompleted: false, videoPlaceholderText: "Verifying grid synchronization and grounding resistance." },
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
    iconName: "Zap",
    description: "Essential hazard protection, Lockout/Tagout (LOTO) protocols, PPE guidelines, and grounding procedures for electricians.",
    level: "Beginner",
    chapters: [
      { id: "c2-1", title: "Understanding Electrical Shock Hazards", duration: "02:20", isCompleted: true, videoPlaceholderText: "Current flow hazards, insulation resistance, and arc flash prevention." },
      { id: "c2-2", title: "Lockout / Tagout (LOTO) Protocol", duration: "03:00", isCompleted: false, videoPlaceholderText: "Isolating energy sources before servicing residential distribution panels." },
      { id: "c2-3", title: "Insulated Tools & PPE Requirements", duration: "02:30", isCompleted: false, videoPlaceholderText: "Selecting 1000V rated gloves, face shields, and insulated hand tools." },
      { id: "c2-4", title: "Ground Fault Protection (GFCI)", duration: "02:30", isCompleted: false, videoPlaceholderText: "Testing circuit breakers and earth leakage circuit breakers (ELCB)." },
    ],
  },
  {
    id: "course-3",
    title: "Inverter Setup Guide",
    category: "Solar Energy",
    categoryId: "solar-energy",
    duration: "08:45",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-emerald-600 to-teal-700",
    iconName: "Sun",
    description: "Step-by-step installation guide for pure sine wave inverters, lithium battery banks, and automatic transfer switches.",
    level: "Intermediate",
    chapters: [
      { id: "c3-1", title: "Inverter Sizing & Load Calculation", duration: "02:15", isCompleted: false, videoPlaceholderText: "Calculating peak wattage requirements for household appliances." },
      { id: "c3-2", title: "Battery Bank Wiring in Series/Parallel", duration: "02:30", isCompleted: false, videoPlaceholderText: "Managing voltage balancing and thermal insulation for battery packs." },
      { id: "c3-3", title: "Automatic Transfer Switch (ATS)", duration: "02:00", isCompleted: false, videoPlaceholderText: "Integrating grid backup with seamless power switching." },
      { id: "c3-4", title: "Final Inspection & Calibration", duration: "02:00", isCompleted: false, videoPlaceholderText: "Configuring cut-off thresholds and battery management software." },
    ],
  },
  {
    id: "course-4",
    title: "Advanced Furniture Carpentry & Joints",
    category: "Carpentry",
    categoryId: "carpentry",
    duration: "15:30",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-orange-600 to-amber-700",
    iconName: "Hammer",
    description: "Master mortise and tenon, dovetail joints, hardwood polishing, and precision wood cutting techniques.",
    level: "Advanced",
    chapters: [
      { id: "c4-1", title: "Wood Type Selection & Grain Alignment", duration: "04:00", isCompleted: true },
      { id: "c4-2", title: "Mortise & Tenon Joint Precision", duration: "05:30", isCompleted: true },
      { id: "c4-3", title: "Sanding & Lacquer Surface Finishing", duration: "06:00", isCompleted: true },
    ],
  },
  {
    id: "course-5",
    title: "Modern Interior Wall Painting & Textures",
    category: "Painting",
    categoryId: "painting",
    duration: "11:10",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-purple-600 to-pink-700",
    iconName: "Paintbrush",
    description: "Surface priming, crack filling, roller techniques, stencil application, and low-VOC paint safety.",
    level: "Intermediate",
    chapters: [
      { id: "c5-1", title: "Wall Putty & Primer Preparation", duration: "03:30", isCompleted: true },
      { id: "c5-2", title: "Roller Stroke Efficiency & Edging", duration: "04:00", isCompleted: true },
      { id: "c5-3", title: "Decorative Texture Stencil Work", duration: "03:40", isCompleted: true },
    ],
  },
  {
    id: "course-6",
    title: "Deep Cleaning & Sanitation Protocols",
    category: "Cleaning",
    categoryId: "cleaning",
    duration: "09:15",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-cyan-600 to-blue-700",
    iconName: "Sparkles",
    description: "Commercial hygiene standards, eco-friendly chemical dilution, floor scrubbing machinery, and disinfections.",
    level: "Beginner",
    chapters: [
      { id: "c6-1", title: "Chemical Dilution Ratios & Safety Data", duration: "03:00", isCompleted: true },
      { id: "c6-2", title: "High-Touch Surface Decontamination", duration: "03:15", isCompleted: true },
      { id: "c6-3", title: "Upholstery & Carpet Extraction Cleaning", duration: "03:00", isCompleted: true },
    ],
  },
  {
    id: "course-7",
    title: "Washing Machine & Microwave Repair",
    category: "Appliance Repair",
    categoryId: "appliance-repair",
    duration: "14:40",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-emerald-700 to-teal-800",
    iconName: "Wrench",
    description: "Diagnostic codes, motor belt replacement, magnetron testing, and PCB circuit troubleshooting.",
    level: "Intermediate",
    chapters: [
      { id: "c7-1", title: "Washing Machine Motor & Drain Pump", duration: "05:00", isCompleted: true },
      { id: "c7-2", title: "Microwave High-Voltage Capacitor Discharge", duration: "04:40", isCompleted: true },
      { id: "c7-3", title: "Control Board Signal Tracing", duration: "05:00", isCompleted: true },
    ],
  },
  {
    id: "course-8",
    title: "Commercial Lawn & Garden Maintenance",
    category: "Gardening",
    categoryId: "gardening",
    duration: "07:50",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-teal-700 to-emerald-800",
    iconName: "Scissors",
    description: "Hedge trimming, drip irrigation setup, soil aeration, organic pest control, and seasonal pruning.",
    level: "Beginner",
    chapters: [
      { id: "c8-1", title: "Drip Irrigation Timer Setup", duration: "02:50", isCompleted: true },
      { id: "c8-2", title: "Pruning Techniques & Tool Care", duration: "02:30", isCompleted: true },
      { id: "c8-3", title: "Organic Composting & Soil Feeding", duration: "02:30", isCompleted: true },
    ],
  },
  {
    id: "course-9",
    title: "Defensive Driving & Vehicle Maintenance",
    category: "Driver Services",
    categoryId: "driver-services",
    duration: "13:00",
    progress: 0,
    buttonText: "Start Learning",
    thumbnailGradient: "from-indigo-600 to-purple-800",
    iconName: "Car",
    description: "Road safety protocols, emergency braking, GPS navigation optimization, and daily fluid checks.",
    level: "Beginner",
    chapters: [
      { id: "c9-1", title: "Pre-Trip Inspection & Fluid Checks", duration: "04:00", isCompleted: false },
      { id: "c9-2", title: "Adverse Weather & Night Driving Safety", duration: "04:30", isCompleted: false },
      { id: "c9-3", title: "Customer Courtesy & Route Planning", duration: "04:30", isCompleted: false },
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
 * Dynamically computes progress percent and button action text for a single course
 * based on completed chapters / total chapters.
 */
export function computeCourseProgress(course: Course): Course {
  const chapters = course.chapters || [];
  const total = chapters.length;
  if (total === 0) {
    return { ...course, progress: 0, buttonText: "Start Learning" };
  }
  const completed = chapters.filter((c) => c.isCompleted).length;
  const progress = Math.round((completed / total) * 100);
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
  const completed = computedCourses.filter((c) => c.progress === 100).length;
  const inProgress = computedCourses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const notStarted = computedCourses.filter((c) => c.progress === 0).length;

  const totalProgressSum = computedCourses.reduce((acc, c) => acc + c.progress, 0);
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
