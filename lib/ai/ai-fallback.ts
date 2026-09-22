import type {
  DemandForecastContext,
  AiDemandForecastResponse,
  ForecastLevel,
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
} from "./ai-types";

/**
 * Deterministic AI Fallback Engine
 *
 * Provides a resilient, factual demand forecast interpretation when
 * the external Groq provider is unavailable, rate-limited, timed out, or unconfigured.
 * Strictly derives metrics from existing platform data.
 */
export function generateDeterministicFallback(
  context: DemandForecastContext,
  reason?: string
): AiDemandForecastResponse {
  // Deterministically infer forecast level from objective platform metrics
  let forecast_level: ForecastLevel = "MODERATE";
  if (
    context.shortage >= 20 ||
    context.demand_last_7_days > context.available_workers * 3
  ) {
    forecast_level = "CRITICAL";
  } else if (
    context.shortage > 0 ||
    context.demand_last_7_days > context.available_workers
  ) {
    forecast_level = "HIGH";
  } else if (context.demand_last_7_days === 0 && context.shortage <= 0) {
    forecast_level = "LOW";
  }

  const isGrowing = context.demand_last_7_days > context.demand_previous_7_days;
  const growthRate =
    context.demand_previous_7_days > 0
      ? Math.round(
          ((context.demand_last_7_days - context.demand_previous_7_days) /
            context.demand_previous_7_days) *
            100
        )
      : 0;

  const outlook = isGrowing
    ? `${context.trade} demand is showing an upward trend (+${growthRate}% vs prior week) in ${context.region} relative to recent platform activity.`
    : `${context.trade} demand remains steady in ${context.region} with ${context.demand_last_7_days} requests over the past 7 days against ${context.available_workers} locally available qualified workers.`;

  const factors: string[] = [
    `Recent booking volume: ${context.demand_last_7_days} requests in past 7 days (${context.demand_previous_7_days} in previous period)`,
    `Local qualified workforce: ${context.available_workers} craftsmen currently available`,
    context.shortage > 0
      ? `Current regional demand gap: ${context.shortage} unfulfilled booking requests`
      : `Workforce capacity currently balanced with local trade demand`,
    context.underutilized_workers > 0
      ? `${context.underutilized_workers} verified craftsmen below 40% bi-weekly capacity available for reallocation`
      : `Workforce utilization within normal operational parameters`,
  ];

  if (context.large_project_demand && context.large_project_demand > 0) {
    factors.push(`Active large project commitments reserving ${context.large_project_demand} craftsmen`);
  }

  if (context.emergency_workload && context.emergency_workload > 0) {
    factors.push(`Active emergency response duties engaging ${context.emergency_workload} craftsmen`);
  }

  const recommended_actions: string[] = [
    context.shortage > 0
      ? `Address the ${context.shortage}-job demand gap by reviewing available qualified capacity in nearby cooperative regions where skills are certified.`
      : `Maintain current shift allocations and monitor weekly request trends.`,
    context.underutilized_workers > 0
      ? `Rebalance service allocations to prioritize under-utilized local craftsmen in this trade.`
      : `Continue standard cooperative rotation schedule.`,
  ];

  const disclaimer = reason
    ? `AI forecasting temporarily unavailable (${reason}). Showing platform demand intelligence.`
    : "AI forecasting temporarily unavailable. Showing platform demand intelligence.";

  return {
    forecast_level,
    outlook,
    factors,
    recommended_actions,
    confidence: "MEDIUM",
    disclaimer,
    is_fallback: true,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Deterministic Federation AI Fallback Engine
 *
 * Derives operational federation workforce insights strictly from factual
 * platform records when Groq is unavailable.
 */
export function generateFederationDeterministicFallback(
  context: FederationDemandContext,
  reason?: string
): FederationAiIntelligenceResponse {
  const totalDemandGap = context.demand_gaps.reduce(
    (acc, g) => acc + Math.max(0, g.demand_gap),
    0
  );
  const primaryGapItem =
    context.demand_gaps.find((g) => g.demand_gap > 0) || context.demand_gaps[0];

  let outlook_level: ForecastLevel = "MODERATE";
  if (
    totalDemandGap > 25 ||
    (context.demand.trend === "INCREASING" && context.workforce.available <= 3)
  ) {
    outlook_level = "CRITICAL";
  } else if (totalDemandGap > 5 || context.demand.trend === "INCREASING") {
    outlook_level = "HIGH";
  } else if (context.demand.current_period === 0 || totalDemandGap <= 0) {
    outlook_level = "LOW";
  }

  const primaryTrade = primaryGapItem ? primaryGapItem.trade : "Key trade";
  const outlook =
    totalDemandGap > 0
      ? `${primaryTrade} demand in ${context.region} is currently elevated relative to available qualified capacity with an estimated ${totalDemandGap}-job regional demand gap.`
      : `Service demand in ${context.region} remains balanced with ${context.workforce.available} qualified workers currently available across trades.`;

  const key_factors: string[] = [
    `Current period service requests: ${context.demand.current_period} (vs ${context.demand.previous_period} prior period, trend: ${context.demand.trend})`,
    `Active workforce roster: ${context.workforce.total_active} craftsmen (${context.workforce.available} available, ${context.workforce.busy} engaged)`,
    totalDemandGap > 0
      ? `Identified demand gap: ${totalDemandGap} unfulfilled booking requests across trade categories`
      : `No immediate trade demand deficits detected in this territory`,
    context.workforce.underutilized > 0
      ? `${context.workforce.underutilized} verified craftsmen currently under-utilized (<40% capacity) available for deployment`
      : `Workforce utilization within normal operational parameters across roster`,
  ];

  if (context.project_workload > 0) {
    key_factors.push(
      `Active large project commitments engaging ${context.project_workload} craftsmen`
    );
  }

  if (context.emergency_workload > 0) {
    key_factors.push(
      `Active emergency response duties engaging ${context.emergency_workload} craftsmen`
    );
  }

  const workforce_insight =
    context.workforce.underutilized > 0
      ? `Existing under-utilized local capacity (${context.workforce.underutilized} workers) should be reviewed before seeking cross-federation workforce rebalancing.`
      : `Local qualified capacity is operating near optimal deployment. Monitor incoming demand peaks closely.`;

  const recommended_actions: string[] = [
    totalDemandGap > 0
      ? `Address the ${totalDemandGap}-job demand gap by reviewing available qualified capacity in trades with elevated request volume.`
      : `Maintain standard cooperative shift allocations and monitor weekly request trends.`,
    context.workforce.underutilized > 0
      ? `Prioritize job dispatches to the ${context.workforce.underutilized} under-utilized craftsmen to improve cooperative earnings equity.`
      : `Continue standard local cooperative scheduling.`,
    totalDemandGap > 10
      ? `Review qualified support from nearby cooperative regions only where workers possess required trade certifications.`
      : `Review upcoming project workload before scheduling additional service commitments.`,
  ];

  const disclaimer = reason
    ? `AI intelligence temporarily unavailable (${reason}). Showing platform workforce intelligence.`
    : "AI intelligence temporarily unavailable. Showing platform workforce intelligence.";

  return {
    outlook_level,
    outlook,
    key_factors,
    workforce_insight,
    recommended_actions,
    confidence: "MEDIUM",
    disclaimer,
    is_fallback: true,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Deterministic Worker AI Assistant (Kaushal Bandhu) Fallback Engine
 *
 * Provides warm, clear, and practical advice in English, Hindi, or Gujarati
 * based on verified platform records.
 */
export function generateWorkerDeterministicFallback(
  context: WorkerAiContext,
  language: WorkerAiLanguage = "hi",
  reason?: string
): WorkerAiAdviceResponse {
  const firstName = context.worker_name
    ? context.worker_name.trim().split(" ")[0]
    : "";

  if (language === "hi") {
    const greeting = firstName
      ? `नमस्ते ${firstName} जी 👋`
      : "नमस्ते साथी 👋";

    if (!context.has_sufficient_activity) {
      return {
        greeting,
        summary:
          "अभी आपके काम की जानकारी कम है। जैसे-जैसे आप KaushalyaSetu पर काम करेंगे, मैं आपको बेहतर सलाह दे पाऊंगा।",
        tips: [
          "अपनी प्रोफाइल में अपने सभी skills सही तरीके से भरें।",
          "काम पाने के लिए अपनी availability को 'Available' पर रखें।",
          "नए काम के अवसर देखने के लिए अपने इलाके की मांग चेक करें।",
        ],
        learning_suggestion: context.relevant_training_title
          ? `उपयोगी प्रशिक्षण के लिए KaushalGrow में '${context.relevant_training_title}' देखें।`
          : "KaushalGrow में अपने काम से जुड़े उपयोगी कोर्स देखें।",
        important_note:
          "समय पर काम पूरा करके और ग्राहकों से अच्छी रेटिंग पाकर काम के अवसर बढ़ाएं।",
        confidence: "MEDIUM",
        disclaimer: reason
          ? `प्लेटफ़ॉर्म आधारित सलाह (${reason})`
          : "प्लेटफ़ॉर्म आधारित सलाह",
        is_fallback: true,
        generated_at: new Date().toISOString(),
      };
    }

    const demandPhrase =
      context.regional_trade_demand === "HIGH" ||
      context.regional_trade_demand === "ELEVATED"
        ? `आपके इलाके में अभी ${context.worker_trade} का काम ज्यादा है।`
        : `आपके इलाके में अभी ${context.worker_trade} का काम सामान्य रूप से चल रहा है।`;

    const tips: string[] = [
      "अपनी availability हमेशा अपडेट रखें ताकि ग्राहक आपको चुन सकें।",
      "ग्राहकों को समय पर और अच्छी सेवा देकर अपनी रेटिंग मजबूत रखें।",
    ];

    if (context.skills.length > 0) {
      tips.push(
        `अपने ${context.skills.slice(0, 2).join(" और ")} के कौशल का विवरण हमेशा अपडेट रखें।`
      );
    } else {
      tips.push("अपनी प्रोफाइल में अपने मुख्य स्किल्स जोड़ें।");
    }

    return {
      greeting,
      summary: demandPhrase,
      tips,
      learning_suggestion: context.relevant_training_title
        ? `KaushalGrow में '${context.relevant_training_title}' सीखकर अपना कौशल बढ़ाएं।`
        : null,
      important_note:
        "काम के नए अवसरों के लिए अपना Schedule & Jobs समय-समय पर चेक करते रहें।",
      confidence: "MEDIUM",
      disclaimer: reason
        ? `प्लेटफ़ॉर्म आधारित सलाह (${reason})`
        : "प्लेटफ़ॉर्म आधारित सलाह",
      is_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  if (language === "gu") {
    const greeting = firstName
      ? `નમસ્તે ${firstName}ભાઈ 👋`
      : "નમસ્તે સાથી 👋";

    if (!context.has_sufficient_activity) {
      return {
        greeting,
        summary:
          "હાલમાં તમારી કામની માહિતી ઓછી છે. તમે KaushalyaSetu પર વધુ કામ કરશો તેમ હું તમને વધુ સારી સલાહ આપી શકીશ.",
        tips: [
          "તમારી પ્રોફાઇલમાં તમારા બધા skills સાચી રીતે ઉમેરો.",
          "કામ મેળવવા માટે તમારી availability હંમેશા 'Available' રાખો.",
          "નવા કામના ઓર્ડર માટે તમારું Schedule નિયમિત ચેક કરો.",
        ],
        learning_suggestion: context.relevant_training_title
          ? `KaushalGrow માં '${context.relevant_training_title}' તાલીમ જોઈ શકો છો.`
          : "KaushalGrow માં ઉપયોગી તાલીમ જુઓ.",
        important_note:
          "સારી ગુણવત્તાનું કામ આપીને તમારી રેટિંગ સારી જાળવી રાખો.",
        confidence: "MEDIUM",
        disclaimer: reason
          ? `પ્લેટફોર્મ આધારિત માર્ગદર્શન (${reason})`
          : "પ્લેટફોર્મ આધારિત માર્ગદર્શન",
        is_fallback: true,
        generated_at: new Date().toISOString(),
      };
    }

    const demandPhrase =
      context.regional_trade_demand === "HIGH" ||
      context.regional_trade_demand === "ELEVATED"
        ? `તમારા વિસ્તારમાં હાલમાં ${context.worker_trade}નું કામ વધારે છે.`
        : `તમારા વિસ્તારમાં હાલમાં ${context.worker_trade}નું કામ ઉપલબ્ધ છે.`;

    const tips: string[] = [
      "ગ્રાહકો તમને સરળતાથી સંપર્ક કરી શકે તે માટે તમારી availability અપડેટ રાખો.",
      "ગ્રાહકોને સમયસર સેવા આપીને તમારું rating સારું રાખો.",
    ];

    if (context.skills.length > 0) {
      tips.push(
        `તમારા ${context.skills.slice(0, 2).join(" અને ")} કૌશલ્ય પ્રોફાઇલમાં અપડેટ રાખો.`
      );
    } else {
      tips.push("તમારી પ્રોફાઇલમાં તમારા મુખ્ય કૌશલ્યો ઉમેરો.");
    }

    return {
      greeting,
      summary: demandPhrase,
      tips,
      learning_suggestion: context.relevant_training_title
        ? `KaushalGrow માં '${context.relevant_training_title}' શીખીને તમારી કુશળતા વધારો.`
        : null,
      important_note:
        "નવા કામના ઓર્ડર જોવા માટે તમારું Schedule નિયમિત જોતા રહો.",
      confidence: "MEDIUM",
      disclaimer: reason
        ? `પ્લેટફોર્મ આધારિત માર્ગદર્શન (${reason})`
        : "પ્લેટફોર્મ આધારિત માર્ગદર્શન",
      is_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  // Default: English
  const greeting = firstName ? `Hello ${firstName} 👋` : "Hello 👋";

  if (!context.has_sufficient_activity) {
    return {
      greeting,
      summary:
        "There is not enough work activity yet. As you use KaushalyaSetu more, I can give you better advice.",
      tips: [
        "Keep your profile and skill details up to date.",
        "Set your availability status to 'Available' when ready for work.",
        "Check your schedule regularly for new customer requests.",
      ],
      learning_suggestion: context.relevant_training_title
        ? `Consider reviewing '${context.relevant_training_title}' in KaushalGrow.`
        : "Explore helpful vocational courses in KaushalGrow.",
      important_note:
        "Providing quality service and earning good ratings will help you receive more opportunities.",
      confidence: "MEDIUM",
      disclaimer: reason
        ? `Platform-based advice (${reason})`
        : "Platform-based advice",
      is_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  const demandPhrase =
    context.regional_trade_demand === "HIGH" ||
    context.regional_trade_demand === "ELEVATED"
      ? `${context.worker_trade} work is currently higher in your area.`
      : `${context.worker_trade} work is currently available in your area.`;

  const tips: string[] = [
    "Keep your availability updated so customers can reach you.",
    "Deliver prompt and courteous service to maintain a high customer rating.",
  ];

  if (context.skills.length > 0) {
    tips.push(
      `Ensure your ${context.skills.slice(0, 2).join(" and ")} skills are highlighted on your profile.`
    );
  } else {
    tips.push("Add your core skills to your profile to attract relevant jobs.");
  }

  return {
    greeting,
    summary: demandPhrase,
    tips,
    learning_suggestion: context.relevant_training_title
      ? `Upgrade your trade skills with '${context.relevant_training_title}' in KaushalGrow.`
      : null,
    important_note:
      "Check your schedule regularly for upcoming bookings and requests.",
    confidence: "MEDIUM",
    disclaimer: reason
      ? `Platform-based advice (${reason})`
      : "Platform-based advice",
    is_fallback: true,
    generated_at: new Date().toISOString(),
  };
}


