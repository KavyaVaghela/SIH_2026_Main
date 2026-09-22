import {
  LearningResource,
  SkillCategory,
  WorkerProgressRecord,
  PublishStatus,
  LMSDashboardStats,
} from "./types";

const LOCAL_STORAGE_KEY = "kaushalyasetu_lms_store_v1";

export const INITIAL_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "solar-energy",
    name: "Solar Energy",
    iconName: "Sun",
    courseCount: 2,
    softBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30",
    description: "Photovoltaic panel mounting, DC wiring, and solar inverter setup.",
  },
  {
    id: "electrical-safety",
    name: "Electrical Safety",
    iconName: "Zap",
    courseCount: 1,
    softBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/30",
    description: "Lockout/Tagout protocols, PPE compliance, and shock prevention.",
  },
  {
    id: "carpentry",
    name: "Carpentry",
    iconName: "Hammer",
    courseCount: 1,
    softBg: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/30",
    description: "Furniture woodwork, mortise/tenon joints, and precision cutting.",
  },
  {
    id: "plumbing",
    name: "Plumbing & Pipe Repair",
    iconName: "Wrench",
    courseCount: 2,
    softBg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-500/30",
    description: "Sanitary fitting, pipeline leakage detection, and drainage repair.",
  },
  {
    id: "painting",
    name: "Painting",
    iconName: "Paintbrush",
    courseCount: 1,
    softBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/30",
    description: "Wall putty, primer application, and textured stencil painting.",
  },
  {
    id: "cleaning",
    name: "Cleaning",
    iconName: "Sparkles",
    courseCount: 1,
    softBg: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-500/30",
    description: "Hygiene standards, eco-friendly chemical dilution, and deep sanitation.",
  },
  {
    id: "appliance-repair",
    name: "Appliance Repair",
    iconName: "Wrench",
    courseCount: 1,
    softBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30",
    description: "Washing machine motors, microwave capacitor discharge, and PCB circuit testing.",
  },
  {
    id: "gardening",
    name: "Gardening",
    iconName: "Scissors",
    courseCount: 1,
    softBg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500/30",
    description: "Hedge trimming, drip irrigation timer setup, and soil aeration.",
  },
  {
    id: "driver-services",
    name: "Driver Services",
    iconName: "Car",
    courseCount: 1,
    softBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/30",
    description: "Defensive driving techniques, vehicle fluid checks, and road safety.",
  },
];

export const INITIAL_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: "resource-1",
    title: "Solar Panel Installation for Beginners",
    description: "Learn basic roof mounting, solar cell wiring, inverter connection, and safety compliance for residential solar projects.",
    category: "Solar Energy",
    categoryId: "solar-energy",
    difficulty: "Beginner",
    duration: "12:15",
    thumbnailGradient: "from-amber-600 to-orange-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Sun",
    learningObjectives: [
      "Identify PV panel voltage and amperage requirements",
      "Mount racking rails securely on pitched roofs",
      "Connect DC solar array to charge controllers",
    ],
    chapters: [
      {
        id: "ch1-1",
        title: "Introduction to PV Solar Cells",
        duration: "03:15",
        lessons: [
          {
            id: "les1-1",
            title: "Understanding PV Energy & Voltage",
            duration: "03:15",
            videoPlaceholderText: "Photovoltaic cell energy generation and voltage safety parameters.",
            videoUrl: "https://www.youtube.com/watch?v=1gba-1vD1G8",
          },
        ],
      },
      {
        id: "ch1-2",
        title: "Roof Angle & Structural Mounting",
        duration: "04:00",
        lessons: [
          {
            id: "les1-2",
            title: "Mounting Rail & Weatherproof Flashing",
            duration: "04:00",
            videoPlaceholderText: "Installing structural roof brackets without causing leak points.",
          },
        ],
      },
      {
        id: "ch1-3",
        title: "DC to AC Wiring Connections",
        duration: "03:00",
        lessons: [
          {
            id: "les1-3",
            title: "Micro-inverter & Charge Controller Setup",
            duration: "03:00",
            videoPlaceholderText: "Wiring solar panels in series and parallel to inverter terminals.",
          },
        ],
      },
      {
        id: "ch1-4",
        title: "System Testing & Commissioning",
        duration: "02:00",
        lessons: [
          {
            id: "les1-4",
            title: "Grid Synchronization & Earthing Check",
            duration: "02:00",
            videoPlaceholderText: "Verifying AC breaker connections and earth ground resistance.",
          },
        ],
      },
    ],
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-15T12:00:00Z",
  },
  {
    id: "resource-2",
    title: "Electrical Safety Basics",
    description: "Essential hazard protection, Lockout/Tagout (LOTO) protocols, PPE guidelines, and grounding procedures for electricians.",
    category: "Electrical Safety",
    categoryId: "electrical-safety",
    difficulty: "Beginner",
    duration: "10:20",
    thumbnailGradient: "from-blue-600 to-indigo-700",
    contentType: "VIDEO",
    youtubeUrl: "https://youtu.be/CSpD6JmNfQs?si=EA7SqqRPOSJSSfiQ",
    status: "PUBLISHED",
    iconName: "Zap",
    learningObjectives: [
      "Master Lockout/Tagout (LOTO) energy isolation",
      "Select rated 1000V insulated gloves and face shields",
      "Test GFCI breakers before live wire inspection",
    ],
    chapters: [
      {
        id: "ch2-1",
        title: "Electrical Hazard Fundamentals",
        duration: "10:20",
        lessons: [
          {
            id: "les2-1",
            title: "Shock & Arc Flash Prevention Video",
            duration: "10:20",
            videoUrl: "https://youtu.be/CSpD6JmNfQs?si=EA7SqqRPOSJSSfiQ",
            videoPlaceholderText: "Complete safety protocol walkthrough for residential electrician servicing.",
          },
        ],
      },
    ],
    createdAt: "2026-09-02T10:00:00Z",
    updatedAt: "2026-09-14T09:00:00Z",
  },
  {
    id: "resource-3",
    title: "Inverter Setup Guide",
    description: "Step-by-step installation guide for pure sine wave inverters, lithium battery banks, and automatic transfer switches.",
    category: "Solar Energy",
    categoryId: "solar-energy",
    difficulty: "Intermediate",
    duration: "08:45",
    thumbnailGradient: "from-emerald-600 to-teal-700",
    contentType: "PDF",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    status: "PUBLISHED",
    iconName: "Sun",
    learningObjectives: [
      "Calculate household peak wattage requirements",
      "Wire lithium battery bank in series-parallel safely",
      "Install Automatic Transfer Switch (ATS) for uninterrupted power",
    ],
    chapters: [
      {
        id: "ch3-1",
        title: "Inverter Installation Manual",
        duration: "08:45",
        lessons: [
          {
            id: "les3-1",
            title: "PDF Manual & Technical Wiring Diagram",
            duration: "08:45",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            description: "Downloadable PDF schematic guide for home inverter and battery bank setup.",
          },
        ],
      },
    ],
    createdAt: "2026-09-03T11:00:00Z",
    updatedAt: "2026-09-16T14:00:00Z",
  },
  {
    id: "resource-4",
    title: "Advanced Furniture Carpentry & Joints",
    description: "Master mortise and tenon, dovetail joints, hardwood polishing, and precision wood cutting techniques.",
    category: "Carpentry",
    categoryId: "carpentry",
    difficulty: "Advanced",
    duration: "15:30",
    thumbnailGradient: "from-orange-600 to-amber-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Hammer",
    chapters: [
      {
        id: "ch4-1",
        title: "Wood Grain & Joint Selection",
        duration: "15:30",
        lessons: [
          { id: "les4-1", title: "Mortise & Tenon Precision", duration: "07:30" },
          { id: "les4-2", title: "Dovetail & Lacquer Finishing", duration: "08:00" },
        ],
      },
    ],
    createdAt: "2026-09-05T08:00:00Z",
    updatedAt: "2026-09-10T10:00:00Z",
  },
  {
    id: "resource-5",
    title: "Modern Interior Wall Painting & Textures",
    description: "Surface priming, crack filling, roller techniques, stencil application, and low-VOC paint safety.",
    category: "Painting",
    categoryId: "painting",
    difficulty: "Intermediate",
    duration: "11:10",
    thumbnailGradient: "from-purple-600 to-pink-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Paintbrush",
    chapters: [
      {
        id: "ch5-1",
        title: "Wall Preparation & Texture Stencils",
        duration: "11:10",
        lessons: [
          { id: "les5-1", title: "Putty & Primer Coat", duration: "05:00" },
          { id: "les5-2", title: "Roller Stencil Technique", duration: "06:10" },
        ],
      },
    ],
    createdAt: "2026-09-06T09:00:00Z",
    updatedAt: "2026-09-11T11:00:00Z",
  },
  {
    id: "resource-6",
    title: "Deep Cleaning & Sanitation Protocols",
    description: "Commercial hygiene standards, eco-friendly chemical dilution, floor scrubbing machinery, and disinfections.",
    category: "Cleaning",
    categoryId: "cleaning",
    difficulty: "Beginner",
    duration: "09:15",
    thumbnailGradient: "from-cyan-600 to-blue-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Sparkles",
    chapters: [
      {
        id: "ch6-1",
        title: "Commercial Hygiene Standards",
        duration: "09:15",
        lessons: [
          { id: "les6-1", title: "Chemical Dilution Ratios", duration: "04:15" },
          { id: "les6-2", title: "Extractor Scrubbing", duration: "05:00" },
        ],
      },
    ],
    createdAt: "2026-09-07T14:00:00Z",
    updatedAt: "2026-09-12T16:00:00Z",
  },
  {
    id: "resource-7",
    title: "Washing Machine & Microwave Repair",
    description: "Diagnostic codes, motor belt replacement, magnetron testing, and PCB circuit troubleshooting.",
    category: "Appliance Repair",
    categoryId: "appliance-repair",
    difficulty: "Intermediate",
    duration: "14:40",
    thumbnailGradient: "from-emerald-700 to-teal-800",
    contentType: "CHAPTERS",
    status: "DRAFT",
    iconName: "Wrench",
    chapters: [
      {
        id: "ch7-1",
        title: "Appliance Troubleshooting Guide",
        duration: "14:40",
        lessons: [
          { id: "les7-1", title: "Motor Belt Replacement", duration: "07:00" },
          { id: "les7-2", title: "Magnetron & PCB Test", duration: "07:40" },
        ],
      },
    ],
    createdAt: "2026-09-08T15:00:00Z",
    updatedAt: "2026-09-13T17:00:00Z",
  },
  {
    id: "resource-8",
    title: "Plumbing Safety & Leakage Detection",
    description: "Master water pressure testing, acoustic and dye leakage detection, sanitary fixture installation, and PPE for plumbing.",
    category: "Plumbing & Pipe Repair",
    categoryId: "plumbing",
    difficulty: "Beginner",
    duration: "13:40",
    thumbnailGradient: "from-cyan-600 to-blue-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Wrench",
    learningObjectives: [
      "Master water shutoff valves and pressure regulation",
      "Detect hairline pipe leakages using dye and acoustic testing",
      "Follow sanitary plumbing PPE and eye protection standards",
    ],
    chapters: [
      {
        id: "ch8-1",
        title: "Plumbing Safety & Equipment Handling",
        duration: "06:20",
        lessons: [
          { id: "les8-1", title: "Main Line Pressure & Valve Safety", duration: "03:10", isCompleted: true },
          { id: "les8-2", title: "PPE and Chemical Drain Safety", duration: "03:10", isCompleted: false },
        ],
      },
      {
        id: "ch8-2",
        title: "Leakage Detection Protocols",
        duration: "07:20",
        lessons: [
          { id: "les8-3", title: "Concealed Pipe Acoustic Detection", duration: "03:40", isCompleted: false },
          { id: "les8-4", title: "Joint Coupling & Sealing Methods", duration: "03:40", isCompleted: false },
        ],
      },
    ],
    createdAt: "2026-09-09T08:00:00Z",
    updatedAt: "2026-09-15T11:00:00Z",
  },
  {
    id: "resource-9",
    title: "Pipe Repair & Sanitary Installation",
    description: "Techniques for CPVC/GI pipe jointing, tap and mixer repairs, flush valve maintenance, and sanitary ware installation.",
    category: "Plumbing & Pipe Repair",
    categoryId: "plumbing",
    difficulty: "Intermediate",
    duration: "16:15",
    thumbnailGradient: "from-teal-600 to-emerald-700",
    contentType: "CHAPTERS",
    status: "PUBLISHED",
    iconName: "Wrench",
    learningObjectives: [
      "Execute solvent welding on CPVC and PVC pipelines",
      "Disassemble and replace ceramic disc mixer cartridges",
      "Install wall-hung and floor-mounted sanitary fixtures",
    ],
    chapters: [
      {
        id: "ch9-1",
        title: "Pipe Cutting & Jointing Techniques",
        duration: "08:00",
        lessons: [
          { id: "les9-1", title: "CPVC & PPR Solvent Welding", duration: "04:00", isCompleted: false },
          { id: "les9-2", title: "Threading & Union Joint Installation", duration: "04:00", isCompleted: false },
        ],
      },
      {
        id: "ch9-2",
        title: "Sanitary Fixture Installation",
        duration: "08:15",
        lessons: [
          { id: "les9-3", title: "Mixer Tap Cartridge Replacement", duration: "04:15", isCompleted: false },
          { id: "les9-4", title: "Drain Trap & Waste Coupling Fixes", duration: "04:00", isCompleted: false },
        ],
      },
    ],
    createdAt: "2026-09-10T10:00:00Z",
    updatedAt: "2026-09-16T15:00:00Z",
  },
];

export interface SharedStoreData {
  categories: SkillCategory[];
  resources: LearningResource[];
  progressRecords: Record<string, WorkerProgressRecord>; // key: `${workerId}_${resourceId}`
}

function loadStoreData(): SharedStoreData {
  if (typeof window === "undefined") {
    return {
      categories: INITIAL_SKILL_CATEGORIES,
      resources: INITIAL_LEARNING_RESOURCES,
      progressRecords: {},
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: SharedStoreData = JSON.parse(raw);
      if (
        parsed &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.resources)
      ) {
        // Ensure new system resources are merged into existing localStorage if missing
        const existingIds = new Set(parsed.resources.map((r: any) => r.id));
        const missingInitial = INITIAL_LEARNING_RESOURCES.filter(
          (init) => !existingIds.has(init.id)
        );
        const existingCatIds = new Set(parsed.categories.map((c: any) => c.id));
        const missingCats = INITIAL_SKILL_CATEGORIES.filter(
          (cat) => !existingCatIds.has(cat.id)
        );

        if (missingInitial.length > 0 || missingCats.length > 0) {
          parsed.resources = [...parsed.resources, ...missingInitial];
          parsed.categories = [...parsed.categories, ...missingCats];
          saveStoreData(parsed);
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to parse LMS store data from localStorage:", err);
  }

  const defaultStore: SharedStoreData = {
    categories: INITIAL_SKILL_CATEGORIES,
    resources: INITIAL_LEARNING_RESOURCES,
    progressRecords: {},
  };
  saveStoreData(defaultStore);
  return defaultStore;
}

function saveStoreData(data: SharedStoreData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to write LMS store data to localStorage:", err);
  }
}

export class SharedLearningStore {
  private static listeners: Array<() => void> = [];

  static subscribe(listener: () => void): () => void {
    SharedLearningStore.listeners.push(listener);

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        listener();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }

    return () => {
      SharedLearningStore.listeners = SharedLearningStore.listeners.filter(
        (l) => l !== listener
      );
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageEvent);
      }
    };
  }

  private static notifyListeners(): void {
    SharedLearningStore.listeners.forEach((l) => l());
  }

  // --- RESOURCE METHODS ---
  static getResources(statusFilter?: PublishStatus): LearningResource[] {
    const data = loadStoreData();
    let list = data.resources;

    if (statusFilter) {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Attach computed counts and category info
    return list.map((res) => SharedLearningStore.attachComputedProgress(res, data.progressRecords));
  }

  static getPublishedResources(): LearningResource[] {
    return SharedLearningStore.getResources("PUBLISHED");
  }

  static getResourceById(id: string): LearningResource | null {
    const data = loadStoreData();
    const res = data.resources.find((r) => r.id === id);
    if (!res) return null;
    return SharedLearningStore.attachComputedProgress(res, data.progressRecords);
  }

  static saveResource(resourceData: Partial<LearningResource>): LearningResource {
    const data = loadStoreData();
    const now = new Date().toISOString();

    let updatedResource: LearningResource;

    if (resourceData.id && data.resources.some((r) => r.id === resourceData.id)) {
      // Edit existing resource (preserve existing chapters/lessons if omitted)
      data.resources = data.resources.map((r) => {
        if (r.id === resourceData.id) {
          updatedResource = {
            ...r,
            ...resourceData,
            updatedAt: now,
          } as LearningResource;
          return updatedResource;
        }
        return r;
      });
    } else {
      // Create new resource
      const newId = resourceData.id || `res-${Date.now()}`;
      updatedResource = {
        id: newId,
        title: resourceData.title || "Untitled Course",
        description: resourceData.description || "",
        category: resourceData.category || "General",
        categoryId: resourceData.categoryId || "solar-energy",
        difficulty: resourceData.difficulty || "Beginner",
        duration: resourceData.duration || "10:00",
        thumbnailGradient: resourceData.thumbnailGradient || "from-emerald-600 to-teal-700",
        thumbnailUrl: resourceData.thumbnailUrl,
        contentType: resourceData.contentType || "CHAPTERS",
        youtubeUrl: resourceData.youtubeUrl,
        pdfUrl: resourceData.pdfUrl,
        status: resourceData.status || "DRAFT",
        iconName: resourceData.iconName || "Sun",
        learningObjectives: resourceData.learningObjectives || [],
        chapters: resourceData.chapters || [
          {
            id: `ch-${Date.now()}-1`,
            title: "Chapter 1: Overview",
            duration: resourceData.duration || "10:00",
            lessons: [
              {
                id: `les-${Date.now()}-1`,
                title: resourceData.title || "Lesson 1",
                duration: resourceData.duration || "10:00",
                videoUrl: resourceData.youtubeUrl,
                pdfUrl: resourceData.pdfUrl,
              },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      data.resources.unshift(updatedResource);
    }

    // Recalculate category counts
    data.categories = SharedLearningStore.recalculateCategoryCounts(data.categories, data.resources);

    saveStoreData(data);
    SharedLearningStore.notifyListeners();
    return updatedResource!;
  }

  static setPublishStatus(id: string, status: PublishStatus): void {
    const data = loadStoreData();
    data.resources = data.resources.map((r) => {
      if (r.id === id) {
        return { ...r, status, updatedAt: new Date().toISOString() };
      }
      return r;
    });
    saveStoreData(data);
    SharedLearningStore.notifyListeners();
  }

  static deleteResource(id: string): void {
    const data = loadStoreData();
    data.resources = data.resources.filter((r) => r.id !== id);
    data.categories = SharedLearningStore.recalculateCategoryCounts(data.categories, data.resources);
    saveStoreData(data);
    SharedLearningStore.notifyListeners();
  }

  // --- CATEGORY METHODS ---
  static getCategories(): SkillCategory[] {
    const data = loadStoreData();
    return SharedLearningStore.recalculateCategoryCounts(data.categories, data.resources);
  }

  static saveCategory(categoryData: Partial<SkillCategory>): SkillCategory {
    const data = loadStoreData();
    let updatedCat: SkillCategory;

    if (categoryData.id && data.categories.some((c) => c.id === categoryData.id)) {
      data.categories = data.categories.map((c) => {
        if (c.id === categoryData.id) {
          updatedCat = { ...c, ...categoryData };
          return updatedCat;
        }
        return c;
      });
    } else {
      const newId = categoryData.id || `cat-${Date.now()}`;
      updatedCat = {
        id: newId,
        name: categoryData.name || "New Category",
        iconName: categoryData.iconName || "Sun",
        courseCount: 0,
        softBg: categoryData.softBg || "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        description: categoryData.description || "",
      };
      data.categories.push(updatedCat);
    }

    data.categories = SharedLearningStore.recalculateCategoryCounts(data.categories, data.resources);
    saveStoreData(data);
    SharedLearningStore.notifyListeners();
    return updatedCat!;
  }

  static deleteCategory(id: string): void {
    const data = loadStoreData();
    // Safety: check if any resources use this category
    const defaultCat = data.categories.find((c) => c.id !== id) || data.categories[0];
    if (defaultCat) {
      data.resources = data.resources.map((r) => {
        if (r.categoryId === id) {
          return { ...r, categoryId: defaultCat.id, category: defaultCat.name };
        }
        return r;
      });
    }

    data.categories = data.categories.filter((c) => c.id !== id);
    saveStoreData(data);
    SharedLearningStore.notifyListeners();
  }

  // --- WORKER PROGRESS METHODS ---
  static toggleWorkerLessonProgress(
    resourceId: string,
    lessonId: string,
    allLessonIdsInCourse: string[],
    workerId: string = "worker-default"
  ): WorkerProgressRecord {
    const data = loadStoreData();
    const key = `${workerId}_${resourceId}`;
    const existing = data.progressRecords[key] || {
      workerId,
      resourceId,
      completedLessonIds: [],
      totalLessons: allLessonIdsInCourse.length || 1,
      progressPercent: 0,
      status: "NOT_STARTED",
      lastUpdated: new Date().toISOString(),
    };

    let updatedCompleted = [...existing.completedLessonIds];
    if (updatedCompleted.includes(lessonId)) {
      updatedCompleted = updatedCompleted.filter((id) => id !== lessonId);
    } else {
      updatedCompleted.push(lessonId);
    }

    const total = allLessonIdsInCourse.length || 1;
    const count = updatedCompleted.length;
    const progressPercent = Math.min(100, Math.round((count / total) * 100));

    let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "NOT_STARTED";
    if (progressPercent === 100) {
      status = "COMPLETED";
    } else if (progressPercent > 0) {
      status = "IN_PROGRESS";
    }

    const updatedRecord: WorkerProgressRecord = {
      ...existing,
      completedLessonIds: updatedCompleted,
      totalLessons: total,
      progressPercent,
      status,
      lastUpdated: new Date().toISOString(),
    };

    data.progressRecords[key] = updatedRecord;
    saveStoreData(data);
    SharedLearningStore.notifyListeners();
    return updatedRecord;
  }

  static getWorkerProgressRecord(
    resourceId: string,
    workerId: string = "worker-default"
  ): WorkerProgressRecord | null {
    const data = loadStoreData();
    const key = `${workerId}_${resourceId}`;
    return data.progressRecords[key] || null;
  }

  // --- DASHBOARD STATS FOR SUPERADMIN ---
  static getLMSDashboardStats(workerId: string = "worker-default"): LMSDashboardStats {
    const data = loadStoreData();
    const publishedResources = data.resources.filter((r) => r.status === "PUBLISHED");

    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let totalProgressSum = 0;

    publishedResources.forEach((res) => {
      const recordKey = `${workerId}_${res.id}`;
      const record = data.progressRecords[recordKey];
      const percent = record ? record.progressPercent : 0;

      if (percent === 100) {
        completedCount++;
      } else if (percent > 0) {
        inProgressCount++;
      } else {
        notStartedCount++;
      }
      totalProgressSum += percent;
    });

    const overallCompletionPercent =
      publishedResources.length > 0
        ? Math.round(totalProgressSum / publishedResources.length)
        : 0;

    return {
      registeredWorkersCount: 142, // Active cooperative workers
      totalCategoriesCount: data.categories.length,
      totalResourcesCount: data.resources.length,
      publishedResourcesCount: publishedResources.length,
      draftResourcesCount: data.resources.filter((r) => r.status === "DRAFT").length,
      overallCompletionPercent,
      completedCoursesCount: completedCount,
      inProgressCoursesCount: inProgressCount,
      notStartedCoursesCount: notStartedCount,
    };
  }

  // --- INTERNAL UTILS ---
  private static attachComputedProgress(
    resource: LearningResource,
    progressRecords: Record<string, WorkerProgressRecord>,
    workerId: string = "worker-default"
  ): LearningResource {
    const key = `${workerId}_${resource.id}`;
    const record = progressRecords[key];

    let allLessons: string[] = [];
    if (resource.chapters) {
      resource.chapters.forEach((ch) => {
        if (ch.lessons) {
          ch.lessons.forEach((les) => allLessons.push(les.id));
        }
      });
    }

    // Mark lessons completed in chapter hierarchy if record exists
    const updatedChapters = (resource.chapters || []).map((ch) => ({
      ...ch,
      lessons: (ch.lessons || []).map((les) => ({
        ...les,
        isCompleted: record ? record.completedLessonIds.includes(les.id) : false,
      })),
      isCompleted: (ch.lessons || []).every((les) =>
        record ? record.completedLessonIds.includes(les.id) : false
      ),
    }));

    const progress = record ? record.progressPercent : 0;
    const buttonText =
      progress === 100
        ? "Review Course"
        : progress > 0
        ? "Continue Learning"
        : "Start Learning";

    return {
      ...resource,
      chapters: updatedChapters,
      progress,
      buttonText,
    };
  }

  private static recalculateCategoryCounts(
    categories: SkillCategory[],
    resources: LearningResource[]
  ): SkillCategory[] {
    return categories.map((cat) => {
      const count = resources.filter((r) => r.categoryId === cat.id && r.status === "PUBLISHED").length;
      return { ...cat, courseCount: count };
    });
  }
}
