import { getAllowedKaushalGrowCourses } from "../features/worker/kaushal-bandhu/services/worker-ai-service";
import { generateWorkerDeterministicFallback } from "../lib/ai/ai-fallback";
import { WorkerAiContext } from "../lib/ai/ai-types";

function runTests() {
  console.log("=================================================");
  console.log("KAUSHAL BANDHU 2.0 - VERIFICATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? " -> " + detail : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: TRADE-ISOLATION & PRE-AI FILTERING
  // -------------------------------------------------------------
  console.log("--- TEST SUITE 1: Trade-Isolation & Pre-AI Filtering ---");

  // Worker A: Plumber
  const plumberCourses = getAllowedKaushalGrowCourses("Plumber", ["Pipe fitting", "Sanitary repairs"]);
  assert(
    plumberCourses.length > 0 &&
    plumberCourses.every(c => c.category === "Plumbing & Pipe Repair"),
    "Plumber receives ONLY Plumbing courses",
    JSON.stringify(plumberCourses.map(c => c.title))
  );
  assert(
    !plumberCourses.some(c => c.category.toLowerCase().includes("electric") || c.course_id === "resource-2"),
    "Plumber NEVER receives Electrical courses"
  );
  assert(
    !plumberCourses.some(c => c.category.toLowerCase().includes("paint")),
    "Plumber NEVER receives Painting courses"
  );

  // Worker B: Painter
  const painterCourses = getAllowedKaushalGrowCourses("Painter", ["Wall painting", "Distemper"]);
  assert(
    painterCourses.length > 0 &&
    painterCourses.every(c => c.category === "Painting"),
    "Painter receives ONLY Painting courses",
    JSON.stringify(painterCourses.map(c => c.title))
  );
  assert(
    !painterCourses.some(c => c.category.toLowerCase().includes("plumb") || c.course_id === "resource-8"),
    "Painter NEVER receives Plumbing courses"
  );
  assert(
    !painterCourses.some(c => c.category.toLowerCase().includes("electric")),
    "Painter NEVER receives Electrical courses"
  );

  // Worker C: Electrician
  const electricianCourses = getAllowedKaushalGrowCourses("Electrician", ["House wiring", "MCB installation"]);
  assert(
    electricianCourses.length > 0 &&
    electricianCourses.every(c => c.category === "Electrical Safety"),
    "Electrician receives ONLY Electrical courses",
    JSON.stringify(electricianCourses.map(c => c.title))
  );
  assert(
    !electricianCourses.some(c => c.category.toLowerCase().includes("plumb")),
    "Electrician NEVER receives Plumbing courses"
  );

  // Worker D: Unsupported Trade (e.g. Gardener)
  const gardenerCourses = getAllowedKaushalGrowCourses("Gardener", ["Plant pruning"]);
  assert(
    gardenerCourses.length === 0,
    "Unsupported trade receives EMPTY course array (no cross-trade leakage)"
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: POST-AI TRADE SAFETY GUARD SIMULATION
  // -------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: Post-AI Trade Safety Guard Simulation ---");

  // Simulate LLM returning an off-trade course (e.g. Electrical Safety Basics for a Plumber)
  const plumberContextCourses = getAllowedKaushalGrowCourses("Plumber", ["Pipe fitting"]);
  const hallucinatedLlmSuggestion = {
    course_id: "resource-2",
    title: "Electrical Safety Basics",
    reason: "Learn electrical safety because it's good."
  };

  // Post-AI Guard Logic (identical to lib/ai/groq-client.ts)
  const matchingAllowed = plumberContextCourses.find(
    (c) =>
      (c.course_id && c.course_id.toLowerCase() === hallucinatedLlmSuggestion.course_id.toLowerCase()) ||
      c.title.toLowerCase().includes(hallucinatedLlmSuggestion.title.toLowerCase()) ||
      hallucinatedLlmSuggestion.title.toLowerCase().includes(c.title.toLowerCase())
  );

  let sanitizedSuggestion: any = null;
  if (matchingAllowed) {
    sanitizedSuggestion = matchingAllowed;
  } else if (plumberContextCourses.length > 0) {
    // REJECT hallucination and replace with safe trade course
    const safeCourse = plumberContextCourses[0];
    sanitizedSuggestion = {
      course_id: safeCourse.course_id,
      title: safeCourse.title,
      category: safeCourse.category,
      reason: `'${safeCourse.title}' आपके काम के लिए उपयोगी कोर्स रहेगा।`
    };
  }

  assert(
    sanitizedSuggestion !== null &&
    sanitizedSuggestion.course_id === "resource-8" &&
    sanitizedSuggestion.category === "Plumbing & Pipe Repair",
    "Post-AI Guard catches hallucinated Electrical course and replaces with Plumber course (resource-8)"
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: DETERMINISTIC FALLBACK & PERSONALIZATION
  // -------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: Deterministic Fallback & Personalization ---");

  // Profile 1: High utilization Plumber in Hindi
  const highUtilPlumberContext: WorkerAiContext = {
    worker_id: "w-plumber-1",
    worker_name: "रमेश कुमार",
    worker_trade: "Plumber",
    skills: ["Pipe fitting", "Sanitary"],
    rating: 4.8,
    reviews_count: 24,
    bookings_last_30_days: 16,
    utilization_level: "HIGH",
    is_new_worker: false,
    regional_trade_demand: "HIGH",
    regional_trade_demand_info: {
      region: "Ahmedabad Central",
      trade: "Plumber",
      demand_level: "HIGH",
      demand_last_7_days: 28,
      available_workers: 6,
      demand_gap: 12
    },
    allowed_courses: plumberCourses
  };

  const hindiFallback = generateWorkerDeterministicFallback(highUtilPlumberContext, "hi");

  assert(
    /[\u0900-\u097F]/.test(hindiFallback.greeting) &&
    /[\u0900-\u097F]/.test(hindiFallback.summary),
    "Hindi fallback contains pure Devanagari script for greeting and summary"
  );
  assert(
    (hindiFallback.priorities?.length || 0) >= 3,
    "Hindi fallback provides 3-5 structured priorities",
    `Found ${hindiFallback.priorities?.length} priorities`
  );
  assert(
    hindiFallback.learning_suggestion?.category === "Plumbing & Pipe Repair",
    "Hindi fallback suggests trade-safe Plumbing course",
    hindiFallback.learning_suggestion?.title
  );
  assert(
    hindiFallback.priorities?.some(p => p.type === "PERFORMANCE" || p.type === "SAFETY"),
    "High utilization plumber receives quality/work-life balance guidance"
  );

  // Profile 2: Low utilization Painter in Gujarati
  const lowUtilPainterContext: WorkerAiContext = {
    worker_id: "w-painter-2",
    worker_name: "સુરેશભાઈ",
    worker_trade: "Painter",
    skills: ["Wall painting"],
    rating: 4.2,
    reviews_count: 5,
    bookings_last_30_days: 2,
    utilization_level: "LOW",
    is_new_worker: false,
    regional_trade_demand: "MODERATE",
    regional_trade_demand_info: {
      region: "Surat West",
      trade: "Painter",
      demand_level: "MODERATE",
      demand_last_7_days: 14,
      available_workers: 10,
      demand_gap: 4
    },
    allowed_courses: painterCourses
  };

  const gujaratiFallback = generateWorkerDeterministicFallback(lowUtilPainterContext, "gu");

  assert(
    /[\u0A80-\u0AFF]/.test(gujaratiFallback.greeting) &&
    /[\u0A80-\u0AFF]/.test(gujaratiFallback.summary),
    "Gujarati fallback contains pure Gujarati script for greeting and summary"
  );
  assert(
    gujaratiFallback.learning_suggestion?.category === "Painting",
    "Gujarati fallback suggests trade-safe Painting course",
    gujaratiFallback.learning_suggestion?.title
  );
  assert(
    gujaratiFallback.priorities?.some(p => p.type === "AVAILABILITY" || p.type === "WORK_OPPORTUNITY"),
    "Low utilization painter receives availability / work opportunity guidance"
  );

  // Profile 3: New Electrician in English
  const newElectricianContext: WorkerAiContext = {
    worker_id: "w-elec-3",
    worker_name: "Amit Patel",
    worker_trade: "Electrician",
    skills: ["Wiring"],
    rating: 0,
    reviews_count: 0,
    bookings_last_30_days: 0,
    utilization_level: "LOW",
    is_new_worker: true,
    regional_trade_demand: "HIGH",
    regional_trade_demand_info: {
      region: "Vadodara North",
      trade: "Electrician",
      demand_level: "HIGH",
      demand_last_7_days: 22,
      available_workers: 4,
      demand_gap: 10
    },
    allowed_courses: electricianCourses
  };

  const englishFallback = generateWorkerDeterministicFallback(newElectricianContext, "en");

  assert(
    englishFallback.priorities?.some(p => p.type === "PROFILE" || p.type === "SKILL"),
    "New worker receives profile setup and initial rating guidance"
  );
  assert(
    englishFallback.learning_suggestion?.category === "Electrical Safety",
    "New electrician receives trade-safe Electrical Safety course",
    englishFallback.learning_suggestion?.title
  );
  assert(
    !JSON.stringify(englishFallback).includes("₹") &&
    !JSON.stringify(englishFallback).toLowerCase().includes("guarantee"),
    "English response contains NO unrealistic earnings guarantees"
  );

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
