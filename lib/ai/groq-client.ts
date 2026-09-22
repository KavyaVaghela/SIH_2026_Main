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
 * Server-side Groq Client for Worker AI Assistant (Kaushal Bandhu)
 *
 * Dedicated digital companion for blue-collar craftsmen.
 * Speaks simple, respectful language in Hindi, Gujarati, or English.
 * Strictly advisory - NEVER promises jobs, wages, or alters system state.
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
        ? "CRITICAL: You MUST respond in clear, simple HINDI using standard Devanagari script (हिंदी लिपि). Avoid complicated words."
        : language === "gu"
        ? "CRITICAL: You MUST respond in clear, simple GUJARATI using standard Gujarati script (ગુજરાતી લિપિ). Avoid complicated words."
        : "CRITICAL: You MUST respond in very simple, plain ENGLISH. Short sentences, easy words.";

    const systemPrompt = `You are "Kaushal Bandhu" (कौशल बंधु / કૌશલ બંધુ), a warm, supportive, and respectful digital companion for service workers and craftsmen on the KaushalyaSetu cooperative platform.

${languageDirective}

PRODUCT & COMMUNICATION PRINCIPLES:
1. Tone: Respectful, polite, friendly, encouraging, and dignified. Address the craftsman with respect (e.g. "साथी", "कारीगर भाई", "કારીગર મિત્ર", "craftsman partner").
2. Language: Very simple vocabulary, short sentences, zero corporate jargon, zero complex technical or AI terms.
3. ADVISORY ONLY - ZERO PROMISES:
   - NEVER guarantee jobs or bookings (e.g., NEVER say "You will receive 5 bookings tomorrow" or "Work is guaranteed").
   - NEVER guarantee income or earnings (e.g., NEVER say "You will earn ₹5,000 this week").
   - INSTEAD say: "Bookings depend on customer needs in your locality", "Keeping your profile active helps when requests arrive".
4. TRUTHFUL DATA:
   - If the worker has 0 or low bookings, honestly and gently acknowledge it. Never pretend they completed 50 jobs.
   - Mention the regional trade demand as general market activity, not as guaranteed personal leads.
   - Mention the recommended learning course from KaushalGrow if provided, explaining simply how new skills help career growth.
5. NO PLATFORM ACTIONS:
   - You CANNOT book jobs, assign work, toggle availability, change rates, or accept projects.
   - If they need to update skills or schedule, politely guide them to the relevant section on their app.

Respond strictly with a JSON object adhering to this exact schema:
{
  "greeting": "Warm greeting addressing the worker respectfully in the requested language",
  "summary": "1 to 2 very simple sentences on their status and trade activity in their area",
  "tips": [
    "Simple practical tip 1 (e.g., keeping phone charged and profile active)",
    "Simple practical tip 2 (e.g., maintaining clean tools and punctuality)",
    "Simple practical tip 3 (e.g., polite communication with customers)"
  ],
  "learning_suggestion": {
    "title": "Course title from context",
    "reason": "1 simple sentence on why this skill is useful",
    "course_id": "course id from context"
  },
  "important_note": "A respectful reminder that work depends on customer requests in the area",
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "disclaimer": "Respectful note that this is friendly guidance to help your work"
}`;

    const userPrompt = JSON.stringify({
      language,
      worker_name: context.worker_name,
      trade: context.trade,
      experience_level: context.experience_level,
      verification_status: context.verification_status,
      availability_status: context.availability_status,
      skills: context.skills,
      certifications: context.certifications,
      completed_bookings_count: context.completed_bookings_count,
      bookings_last_30_days: context.bookings_last_30_days,
      rating: context.rating,
      regional_trade_demand: context.regional_trade_demand,
      recommended_course: context.recommended_course,
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
        temperature: 0.3,
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

    const greeting: string =
      typeof parsed.greeting === "string" && parsed.greeting.trim()
        ? parsed.greeting.trim()
        : language === "hi"
        ? `नमस्ते ${context.worker_name || "साथी"}, कौशल बंधु में आपका स्वागत है।`
        : language === "gu"
        ? `નમસ્તે ${context.worker_name || "સાથી"}, કૌશલ બંધુમાં તમારું સ્વાગત છે.`
        : `Hello ${context.worker_name || "Partner"}, welcome to Kaushal Bandhu.`;

    const summary: string =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : language === "hi"
        ? `आप ${context.trade} सेवा में पंजीकृत हैं। अपना प्रोफ़ाइल सक्रिय रखें।`
        : language === "gu"
        ? `તમે ${context.trade} સેવામાં નોંધાયેલા છો. તમારી પ્રોફાઇલ સક્રિય રાખો.`
        : `You are registered in ${context.trade}. Keep your profile active.`;

    const defaultTips =
      language === "hi"
        ? [
            "अपनी उपलब्धता सही रखें ताकि काम के समय सूचना मिल सके।",
            "काम पर समय पर पहुंचें और अपने औजार तैयार रखें।",
            "ग्राहकों से विनम्रता से बात करें, इससे रेटिंग अच्छी मिलती है।",
          ]
        : language === "gu"
        ? [
            "તમારી ઉપલબ્ધતા સમયસર અપડેટ કરો જેથી નવા કામની માહિતી મળે.",
            "કામ પર સમયસર પહોંચો અને સાધનો તૈયાર રાખો.",
            "ગ્રાહકો સાથે નમ્રતાથી વાત કરો, જેનાથી રેટિંગ સુધરે છે.",
          ]
        : [
            "Keep your availability status updated to receive notifications.",
            "Arrive on time and keep your tools clean and ready.",
            "Speak politely with customers to earn higher ratings.",
          ];

    const tips: string[] =
      Array.isArray(parsed.tips) && parsed.tips.length > 0
        ? parsed.tips.map(String)
        : defaultTips;

    let learning_suggestion = undefined;
    if (parsed.learning_suggestion && typeof parsed.learning_suggestion === "object") {
      learning_suggestion = {
        title: String(parsed.learning_suggestion.title || context.recommended_course?.title || "Skill Training"),
        reason: String(parsed.learning_suggestion.reason || "नया हुनर सीखने से काम के अवसर बढ़ते हैं।"),
        course_id: String(parsed.learning_suggestion.course_id || context.recommended_course?.course_id || ""),
      };
    } else if (context.recommended_course) {
      learning_suggestion = {
        title: context.recommended_course.title,
        reason:
          language === "hi"
            ? "यह कोर्स पूरा करने से आपको इस काम में नई तकनीक सीखने को मिलेगी।"
            : language === "gu"
            ? "આ કોર્સ શીખવાથી તમને કામમાં નવી કુશળતા મળશે."
            : "Completing this course helps you master new modern techniques.",
        course_id: context.recommended_course.course_id,
      };
    }

    const important_note: string =
      typeof parsed.important_note === "string" && parsed.important_note.trim()
        ? parsed.important_note.trim()
        : language === "hi"
        ? "कृपया ध्यान दें: नए काम की सूचना ग्राहकों की मांग और आपके क्षेत्र पर निर्भर करती है।"
        : language === "gu"
        ? "ધ્યાન રાખો: નવું કામ ગ્રાહકોની જરૂરિયાત અને તમારા વિસ્તાર પર આધાર રાખે છે."
        : "Please note: New work depends on customer requests in your area.";

    const disclaimer: string =
      typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : language === "hi"
        ? "यह सलाह आपके मार्गदर्शन के लिए है। किसी भी काम की कोई गारंटी नहीं दी जाती।"
        : language === "gu"
        ? "આ માર્ગદર્શન તમારા સહકાર માટે છે. કોઈ કામની ગેરંટી અપાતી નથી."
        : "This guidance is for assistance only. No job or income guarantees are made.";

    return {
      greeting,
      summary,
      tips,
      learning_suggestion,
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

