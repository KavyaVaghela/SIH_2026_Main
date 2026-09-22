import type {
  DemandForecastContext,
  AiDemandForecastResponse,
  ForecastLevel,
  ForecastConfidence,
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
  WorkerAiPriority,
  WorkerLearningSuggestion,
} from "./ai-types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds timeout

/**
 * Server-side Groq Client
 *
 * Exclusively executes server-side. Never exposes GROQ_API_KEY to browser bundles.
 */
export async function callGroqDemandForecast(
  apiKey: string,
  context: DemandForecastContext
): Promise<AiDemandForecastResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const systemPrompt = `You are an operational demand intelligence advisory engine for a cooperative gig services platform.
Analyze the provided deterministic regional demand and workforce metrics.

CRITICAL OPERATIONAL RULES:
1. 'shortage' / 'demand_gap' represents an UNMET DEMAND / JOB GAP (unfulfilled booking requests exceeding local immediately available capacity), NOT a count of missing individual workers.
   - NEVER say: "Recruit 186 plumbing workers" or "186-worker shortage".
   - INSTEAD say: "Address the 186-job demand gap by reviewing available qualified capacity", "Consider additional qualified workforce capacity if the demand gap persists", "Review cross-federation support only where workers have required certifications".
2. Clearly distinguish between:
   - Demand/Job Gap (volume of booking requests exceeding local capacity)
   - Available qualified workers (active local craftsmen in this specific trade)
   - Under-utilized workers (local craftsmen with <40% capacity available for reallocation)
   - Actual workforce expansion needs (only if persistent demand gap cannot be met by available capacity)
3. Never recommend assigning cross-trade workers unless the required skill or certification is explicitly compatible.
4. Do NOT invent numbers, worker counts, prices, or locations. All numbers must strictly align with the provided data.
5. The forecast level (LOW | MODERATE | HIGH | CRITICAL) must objectively reflect the factual demand gap and workforce capacity balance.
6. Provide objective, professional, operations-grade insights. Advisory interpretation only.

Respond strictly with a JSON object adhering to this exact schema:
{
  "forecast_level": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "outlook": "Concise summary sentence regarding trade demand trend and capacity pressure.",
  "factors": ["List of 3 to 4 key quantitative or operational contributing factors"],
  "recommended_actions": ["List of 2 to 3 actionable advisory steps for the cooperative administrator"],
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "disclaimer": "Advisory interpretation based on real platform activity."
}`;

    const userPrompt = JSON.stringify({
      trade: context.trade,
      region: context.region,
      demand_last_7_days: context.demand_last_7_days,
      demand_previous_7_days: context.demand_previous_7_days,
      demand_last_30_days: context.demand_last_30_days,
      available_workers: context.available_workers,
      underutilized_workers: context.underutilized_workers,
      demand_gap_unmet_jobs: context.shortage,
      large_project_demand: context.large_project_demand || 0,
      emergency_workload: context.emergency_workload || 0,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error("Rate limit reached (429)");
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response returned by Groq");
    }

    const parsed = JSON.parse(rawContent);

    // Validate structured fields
    const validLevels: ForecastLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const forecast_level: ForecastLevel = validLevels.includes(parsed.forecast_level)
      ? parsed.forecast_level
      : "MODERATE";

    const validConfidence: ForecastConfidence[] = ["LOW", "MEDIUM", "HIGH"];
    const confidence: ForecastConfidence = validConfidence.includes(parsed.confidence)
      ? parsed.confidence
      : "MEDIUM";

    const outlook: string = typeof parsed.outlook === "string" && parsed.outlook.trim()
      ? parsed.outlook.trim()
      : `${context.trade} demand is showing an active trend in ${context.region}.`;

    const factors: string[] = Array.isArray(parsed.factors) && parsed.factors.length > 0
      ? parsed.factors.map(String)
      : [
          `Past 7 days demand: ${context.demand_last_7_days} requests`,
          `Available workforce: ${context.available_workers} craftsmen`,
        ];

    const recommended_actions: string[] = Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
      ? parsed.recommended_actions.map(String)
      : [`Review available qualified workforce in nearby cooperative regions.`];

    const disclaimer: string = typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
      ? parsed.disclaimer.trim()
      : "AI-generated advisory interpretation based on platform statistics.";

    return {
      forecast_level,
      outlook,
      factors,
      recommended_actions,
      confidence,
      disclaimer,
      is_fallback: false,
      generated_at: new Date().toISOString(),
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq API request timed out (exceeded 10s)");
    }
    throw error;
  }
}

/**
 * Server-side Groq Client for Federation Admin Workforce Intelligence
 */
export async function callGroqFederationIntelligence(
  apiKey: string,
  context: FederationDemandContext
): Promise<FederationAiIntelligenceResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const systemPrompt = `You are an operational AI advisory engine for a regional cooperative labor federation administrator.
Analyze the provided verified workforce and service demand data for this cooperative federation.

CRITICAL OPERATIONAL RULES:
1. 'demand_gap' represents an UNMET DEMAND / JOB GAP (service requests exceeding locally available qualified capacity), NOT the number of missing individual workers.
   - NEVER say: "Recruit 37 plumbers" or "37-worker shortage".
   - INSTEAD say: "Address the 37-job demand gap by reviewing available qualified capacity", "Consider expanding qualified capacity if demand remains elevated".
2. Clearly distinguish between:
   - Total service demand (booking requests in the territory)
   - Active workforce (total registered, verified craftsmen in this federation)
   - Available qualified capacity (craftsmen currently available for dispatch)
   - Under-utilized capacity (craftsmen working <40% capacity who can absorb more work)
   - Demand gap (unmet service requests)
3. Never claim or recommend assigning a worker to another trade unless the platform data explicitly supports that qualification.
4. Do NOT invent numbers, worker counts, worker names, prices, or locations. All numbers must strictly align with the provided data.
5. Recommended actions must be operational and advisory (e.g., "Review available qualified workforce in high-demand trades", "Prioritize dispatch of under-utilized craftsmen", "Review upcoming project workload before scheduling additional commitments", "Consider cross-federation support only where workers have required trade certifications").
   - NEVER recommend automatic worker assignment, changing worker availability, rejecting/accepting bookings, or modifying earnings.
6. Provide concise, high-impact operational insights. Avoid long marketing paragraphs or repetitive sentences.

Respond strictly with a JSON object adhering to this exact schema:
{
  "outlook_level": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "outlook": "Concise summary sentence regarding current demand pressure and capacity balance.",
  "key_factors": ["List of 3 to 4 factual operational factors influencing this outlook"],
  "workforce_insight": "Actionable insight on workforce utilization and capacity deployment.",
  "recommended_actions": ["List of 2 to 3 practical advisory recommendations for the federation administrator"],
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "disclaimer": "AI-generated advisory interpretation based on verified cooperative metrics."
}`;

    const userPrompt = JSON.stringify({
      federation_id: context.federation_id,
      federation_name: context.federation_name,
      region: context.region,
      demand: context.demand,
      workforce: context.workforce,
      demand_gaps: context.demand_gaps,
      project_workload: context.project_workload,
      emergency_workload: context.emergency_workload,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error("Rate limit reached (429)");
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response returned by Groq");
    }

    const parsed = JSON.parse(rawContent);

    // Validate structured fields
    const validLevels: ForecastLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const outlook_level: ForecastLevel = validLevels.includes(parsed.outlook_level)
      ? parsed.outlook_level
      : "MODERATE";

    const validConfidence: ForecastConfidence[] = ["LOW", "MEDIUM", "HIGH"];
    const confidence: ForecastConfidence = validConfidence.includes(parsed.confidence)
      ? parsed.confidence
      : "MEDIUM";

    const outlook: string =
      typeof parsed.outlook === "string" && parsed.outlook.trim()
        ? parsed.outlook.trim()
        : `Service demand in ${context.region} is showing steady operational activity.`;

    const key_factors: string[] =
      Array.isArray(parsed.key_factors) && parsed.key_factors.length > 0
        ? parsed.key_factors.map(String)
        : [
            `Current period demand: ${context.demand.current_period} service requests`,
            `Active workforce: ${context.workforce.total_active} craftsmen (${context.workforce.available} available)`,
          ];

    const workforce_insight: string =
      typeof parsed.workforce_insight === "string" && parsed.workforce_insight.trim()
        ? parsed.workforce_insight.trim()
        : `Review available and under-utilized workforce capacity to optimize local trade allocations.`;

    const recommended_actions: string[] =
      Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
        ? parsed.recommended_actions.map(String)
        : [
            `Review available qualified workforce in high-demand trades.`,
            `Prioritize dispatch of under-utilized local craftsmen.`,
          ];

    const disclaimer: string =
      typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : "AI-generated advisory interpretation based on verified cooperative metrics.";

    return {
      outlook_level,
      outlook,
      key_factors,
      workforce_insight,
      recommended_actions,
      confidence,
      disclaimer,
      is_fallback: false,
      generated_at: new Date().toISOString(),
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq API request timed out (exceeded 10s)");
    }
    throw error;
  }
}

/**
 * Server-side Groq Client for Worker AI Assistant (Kaushal Bandhu 2.0)
 *
 * Dedicated digital companion for blue-collar craftsmen on KaushalyaSetu.
 * Production rules:
 * 1. Speaks clear, simple, respectful everyday language in Hindi, Gujarati, or English.
 * 2. 100% of generated content in the requested language (no mixed Hindi/English/Gujarati).
 * 3. Never makes unrealistic earnings guarantees or promises job counts.
 * 4. Grounded strictly in factual context (rating, reviews, completed jobs, demand, utilization).
 * 5. Trade Safety Rule: ONLY allowed_courses are sent to Groq. Post-AI validation strictly
 *    verifies and rejects any course outside allowed_courses.
 */
export async function callGroqWorkerAssistant(
  apiKey: string,
  context: WorkerAiContext,
  language: WorkerAiLanguage = "hi"
): Promise<WorkerAiAdviceResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const languageDirective =
      language === "hi"
        ? `CRITICAL MULTILINGUAL RULE (HINDI):
- The ENTIRE JSON response (greeting, summary, priorities titles, priorities messages, actions, learning reason, important note, disclaimer) MUST be in pure, simple, everyday HINDI in standard Devanagari script (हिंदी लिपि).
- Do NOT mix English sentences or Gujarati words.
- Short sentences (1-2 sentences per point). Easy words suitable for workers with basic education.`
        : language === "gu"
        ? `CRITICAL MULTILINGUAL RULE (GUJARATI):
- The ENTIRE JSON response (greeting, summary, priorities titles, priorities messages, actions, learning reason, important note, disclaimer) MUST be in pure, simple, everyday GUJARATI in standard Gujarati script (ગુજરાતી લિપિ).
- Do NOT mix English sentences or Hindi words.
- Short sentences (1-2 sentences per point). Easy words suitable for workers with basic education.`
        : `CRITICAL MULTILINGUAL RULE (ENGLISH):
- The ENTIRE JSON response MUST be in very simple, plain ENGLISH.
- Short sentences (1-2 sentences per point), zero corporate or technical jargon.`;

    const systemPrompt = `You are "Kaushal Bandhu" (कौशल बंधु / કૌશલ બંધુ), the worker care, performance, and skill development assistant on KaushalyaSetu, a cooperative-owned service platform.

${languageDirective}

PRODUCT PRINCIPLES & GUIDELINES:
1. WHAT YOU DO: Answer "What can I practically do today to improve my work opportunities, service quality and earning potential on KaushalyaSetu?"
2. DO NOT GIVE GENERIC MOTIVATIONAL ADVICE. Ground every recommendation in the worker's real profile, recent jobs, rating, local demand, and utilization.
3. NEVER GUARANTEE EARNINGS OR WORK:
   - NEVER say "You will earn ₹25,000" or "You will get 10 jobs".
   - Grounded wording: "Keeping your availability updated helps customers find you", "High local demand may create more opportunities", "Completing this relevant course can help you qualify for more jobs".
4. PERFORMANCE & UTILIZATION CONTEXT:
   - Low utilization (<4 jobs recently): Remind them to keep availability ON when ready, check contact details, and review core skills.
   - High utilization (>12 jobs recently): Encourage keeping time between jobs to maintain service quality, polite communication, and resting.
   - New worker (0 reviews / 0 jobs): Encourage completing skills, adding experience, and taking the first trade safety course.
   - Rating: If rating > 4.5, congratulate and encourage maintaining quality; if lower, suggest punctuality and clear customer communication.
5. ABSOLUTE TRADE SAFETY RULE:
   - Worker trade is: "${context.worker_trade}".
   - You MUST ONLY recommend a course from the "allowed_courses" list provided in the prompt.
   - NEVER recommend an electrical course to a plumber, or a plumbing course to an electrician, or an unrelated course to a painter.
   - If "allowed_courses" is empty, set learning_suggestion to null or explain simply in the requested language that no new course is available for their trade right now.

Respond strictly with a JSON object adhering to this exact schema:
{
  "greeting": "Warm, respectful greeting addressing the worker by name or partner in requested language",
  "summary": "1 to 2 very simple sentences on their current status, recent activity, and local demand",
  "priorities": [
    {
      "type": "WORK_OPPORTUNITY" | "PERFORMANCE" | "AVAILABILITY" | "PROFILE" | "SKILL" | "SAFETY" | "EARNINGS",
      "title": "Short title in requested language (3-4 words)",
      "message": "1 to 2 short, simple sentences with practical actionable advice",
      "action": "Optional concise button label (e.g. 'उपलब्धता जांचें' / 'ઉપલબ્ધતા ચકાસો' / 'Check Availability')"
    }
  ],
  "learning_suggestion": {
    "course_id": "course_id from allowed_courses",
    "title": "course title exactly as listed in allowed_courses",
    "reason": "1 short sentence in requested language on why this course is helpful for their trade"
  },
  "important_note": "A respectful reminder in requested language (e.g., check availability before taking more work / new work depends on local customer requests)",
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "disclaimer": "Respectful advisory note in requested language explaining that guidance is based on real cooperative platform data"
}`;

    const safeAllowedCourses = context.allowed_courses || (context.recommended_course ? [context.recommended_course] : []);

    const userPrompt = JSON.stringify({
      target_language: language,
      worker_name: context.worker_name,
      worker_trade: context.worker_trade,
      experience_level: context.experience_level,
      verification_status: context.verification_status,
      availability_status: context.availability_status,
      skills: context.skills,
      certifications: context.certifications,
      completed_bookings_count: context.completed_bookings_count,
      bookings_last_30_days: context.bookings_last_30_days,
      rating: context.rating,
      reviews_count: context.reviews_count || 0,
      is_new_worker: context.is_new_worker || false,
      utilization_level: context.utilization_level,
      regional_trade_demand: context.regional_trade_demand,
      region_name: context.regional_trade_demand_info?.region || "Local Area",
      allowed_courses: safeAllowedCourses,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.25,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error("Rate limit reached (429)");
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Groq API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response returned by Groq");
    }

    const parsed = JSON.parse(rawContent);

    // 1. GREETING
    const greeting: string =
      typeof parsed.greeting === "string" && parsed.greeting.trim()
        ? parsed.greeting.trim()
        : language === "hi"
        ? `नमस्ते ${context.worker_name || "साथी"} 👋`
        : language === "gu"
        ? `નમસ્તે ${context.worker_name || "સાથી"}ભાઈ 👋`
        : `Hello ${context.worker_name || "Partner"} 👋`;

    // 2. SUMMARY
    const summary: string =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : language === "hi"
        ? `आपके इलाके में ${context.worker_trade} के काम की मांग सक्रिय है।`
        : language === "gu"
        ? `તમારા વિસ્તારમાં ${context.worker_trade}ના કામની માંગ સક્રિય છે.`
        : `${context.worker_trade} demand is active in your area.`;

    // 3. STRUCTURED PRIORITIES (3-5 items)
    let priorities: WorkerAiPriority[] = [];
    if (Array.isArray(parsed.priorities) && parsed.priorities.length > 0) {
      priorities = (parsed.priorities as Array<Record<string, unknown>>).slice(0, 5).map((p) => ({
        type: (typeof p.type === "string" && ["WORK_OPPORTUNITY", "PERFORMANCE", "AVAILABILITY", "PROFILE", "SKILL", "SAFETY", "EARNINGS"].includes(p.type))
          ? (p.type as WorkerAiPriority["type"])
          : "WORK_OPPORTUNITY",
        title: String(p.title || "महत्वपूर्ण सुझाव"),
        message: String(p.message || ""),
        action: p.action ? String(p.action) : undefined,
      }));
    }

    // Extract simple tips for backward compatibility
    const tips: string[] = priorities.length > 0
      ? priorities.map((p) => `${p.title}: ${p.message}`)
      : Array.isArray(parsed.tips) && parsed.tips.length > 0
      ? parsed.tips.map(String)
      : language === "hi"
      ? [
          "अगर आप काम के लिए तैयार हैं, तो अपनी availability ON रखें।",
          "ग्राहकों से काम के बाद फीडबैक जरूर लें।",
          "समय पर पहुंचना और अच्छा व्यवहार आपकी रेटिंग मजबूत करता है।",
        ]
      : language === "gu"
      ? [
          "જો તમે કામ માટે તૈયાર હોવ, તો તમારી availability ON રાખો.",
          "કામ પૂરું થયા પછી ગ્રાહક પાસેથી પ્રતિસાદ મેળવો.",
          "સમયસર પહોંચવાથી અને સારી સેવાથી તમારું રેટિંગ સારું રહે છે.",
        ]
      : [
          "Keep your availability ON when ready to take service requests.",
          "Polite communication and punctuality ensure higher customer ratings.",
          "Update your core skills to match incoming customer requirements.",
        ];

    // 4. HARD POST-AI TRADE SAFETY GUARD
    // A course recommended by the LLM MUST exist in safeAllowedCourses.
    // If it is unrelated or violated, reject it and replace with top allowed course or safe message!
    let validatedLearningSuggestion: WorkerLearningSuggestion | null = null;

    if (parsed.learning_suggestion && typeof parsed.learning_suggestion === "object") {
      const recTitle = String(parsed.learning_suggestion.title || "").toLowerCase();
      const recId = String(parsed.learning_suggestion.course_id || "").toLowerCase();

      // Check if recommended course is in allowed set
      const matchingAllowed = safeAllowedCourses.find(
        (c) =>
          (c.course_id && c.course_id.toLowerCase() === recId) ||
          c.title.toLowerCase().includes(recTitle) ||
          recTitle.includes(c.title.toLowerCase())
      );

      if (matchingAllowed) {
        validatedLearningSuggestion = {
          course_id: matchingAllowed.course_id,
          title: matchingAllowed.title,
          category: matchingAllowed.category,
          reason: String(parsed.learning_suggestion.reason || matchingAllowed.reason),
        };
      } else if (safeAllowedCourses.length > 0) {
        // AI recommended an off-trade course (e.g. Electrical for Plumber).
        // REJECT and substitute with top safe trade course!
        const safeCourse = safeAllowedCourses[0];
        validatedLearningSuggestion = {
          course_id: safeCourse.course_id,
          title: safeCourse.title,
          category: safeCourse.category,
          reason:
            language === "hi"
              ? `'${safeCourse.title}' आपके काम के लिए उपयोगी कोर्स रहेगा।`
              : language === "gu"
              ? `'${safeCourse.title}' તમારા કામ માટે ઉપયોગી કોર્સ રહેશે.`
              : `'${safeCourse.title}' is a valuable training course for your trade.`,
        };
      }
    } else if (safeAllowedCourses.length > 0) {
      const safeCourse = safeAllowedCourses[0];
      validatedLearningSuggestion = {
        course_id: safeCourse.course_id,
        title: safeCourse.title,
        category: safeCourse.category,
        reason:
          language === "hi"
            ? `'${safeCourse.title}' आपके काम के लिए उपयोगी कोर्स रहेगा।`
            : language === "gu"
            ? `'${safeCourse.title}' તમારા કામ માટે ઉપયોગી કોર્સ રહેશે.`
            : `'${safeCourse.title}' is a valuable training course for your trade.`,
      };
    }

    const important_note: string =
      typeof parsed.important_note === "string" && parsed.important_note.trim()
        ? parsed.important_note.trim()
        : language === "hi"
        ? "ध्यान रखें: नया काम आपके इलाके में ग्राहकों की मांग पर निर्भर करता है।"
        : language === "gu"
        ? "ધ્યાન રાખો: નવું કામ તમારા વિસ્તારમાં ગ્રાહકોની જરૂરિયાત પર આધાર રાખે છે."
        : "Please note: Job opportunities depend on active customer requests in your area.";

    const disclaimer: string =
      typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : language === "hi"
        ? "यह मार्गदर्शन आपके वास्तविक काम और प्लेटफ़ॉर्म डेटा पर आधारित है।"
        : language === "gu"
        ? "આ માર્ગદર્શન તમારા વાસ્તવિક કાર્ય અને પ્લેટફોર્મ ડેટા પર આધારિત છે."
        : "Advisory guidance grounded in verified platform and regional activity.";

    return {
      greeting,
      summary,
      priorities,
      tips,
      learning_suggestion: validatedLearningSuggestion,
      important_note,
      confidence: "HIGH",
      disclaimer,
      is_fallback: false,
      generated_at: new Date().toISOString(),
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq API request timed out (exceeded 10s)");
    }
    throw error;
  }
}

