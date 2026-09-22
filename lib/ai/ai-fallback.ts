import type {
  DemandForecastContext,
  AiDemandForecastResponse,
  ForecastLevel,
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
  WorkerAiPriority,
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

  const isHighDemand =
    context.regional_trade_demand === "HIGH" ||
    context.regional_trade_demand === "ELEVATED";

  const isUnderUtilized = context.utilization_level === "LOW";
  const isHighUtilized = context.utilization_level === "HIGH";

  // Safe trade-filtered course selection
  const safeCourse =
    context.allowed_courses && context.allowed_courses.length > 0
      ? context.allowed_courses[0]
      : null;

  // ----------------------------------------------------
  // HINDI DETERMINISTIC RESPONSE (Pure Devanagari)
  // ----------------------------------------------------
  if (language === "hi") {
    const greeting = firstName
      ? `नमस्ते ${firstName} जी 👋`
      : "नमस्ते कारीगर साथी 👋";

    let summary = isHighDemand
      ? `आपके इलाके में ${context.worker_trade} के काम की मांग अभी ज्यादा है।`
      : `आपके इलाके में ${context.worker_trade} का काम सामान्य रूप से चल रहा है।`;

    if (context.is_new_worker) {
      summary = "आप KaushalyaSetu पर नए कारीगर साथी हैं। आपकी प्रोफाइल तैयार करने में मैं आपकी मदद करूंगा।";
    }

    const priorities: WorkerAiPriority[] = [];

    // 1. Work opportunity / availability
    if (isUnderUtilized) {
      priorities.push({
        type: "AVAILABILITY",
        title: "काम का मौका",
        message: "आपके पास हाल में कम काम आया है। अगर आप तैयार हैं, तो अपनी उपलब्धता (Availability) ON रखें।",
        action: "उपलब्धता जांचें",
      });
    } else if (isHighUtilized) {
      priorities.push({
        type: "PERFORMANCE",
        title: "आराम और गुणवत्ता",
        message: "हाल ही में आपके पास काफी काम रहा है। दो कामों के बीच पर्याप्त समय रखें ताकि काम की गुणवत्ता बनी रहे।",
      });
    } else {
      priorities.push({
        type: "WORK_OPPORTUNITY",
        title: "काम का मौका",
        message: isHighDemand
          ? `आपके इलाके में ${context.worker_trade} के काम की अच्छी मांग है। अपनी उपलब्धता ON रखें।`
          : "नियमित काम पाने के लिए अपने शेड्यूल पर नजर रखें।",
        action: "उपलब्धता जांचें",
      });
    }

    // 2. Performance / Rating
    if (context.rating >= 4.5 && (context.reviews_count ?? 0) > 0) {
      priorities.push({
        type: "PERFORMANCE",
        title: "बेहतरीन सेवा",
        message: `आपकी रेटिंग ${context.rating} बहुत अच्छी है। ग्राहकों से समय पर पहुंचना और साफ बातचीत बनाए रखें।`,
      });
    } else if (context.is_new_worker) {
      priorities.push({
        type: "PROFILE",
        title: "प्रोफाइल पूरी करें",
        message: "अपनी प्रोफाइल में मुख्य हुनर और अनुभव दर्ज करें ताकि ग्राहकों का भरोसा बढ़े।",
        action: "प्रोफाइल देखें",
      });
    } else {
      priorities.push({
        type: "PERFORMANCE",
        title: "ग्राहकों की संतुष्टि",
        message: "काम पूरा होने पर ग्राहक से विनम्रता से बात करें और फीडबैक देने का अनुरोध करें।",
      });
    }

    // 3. Earnings / Realism (NO unrealistic guarantees)
    priorities.push({
      type: "EARNINGS",
      title: "कमाई के अवसर",
      message: isHighDemand
        ? "मांग अच्छी रहने पर सही समय पर काम स्वीकार करने से आपकी आय में सुधार की संभावना रहती है।"
        : "नियमित उपलब्धता और अच्छी रेटिंग बनाए रखने से आपको लगातार काम मिलने में मदद मिलती है।",
    });

    // 4. Trade-safe Skill Recommendation
    if (safeCourse) {
      priorities.push({
        type: "SKILL",
        title: "हुनर में सुधार",
        message: `'${safeCourse.title}' कोर्स आपके ${context.worker_trade} के काम के लिए काफी उपयोगी रहेगा।`,
        action: "कोर्स सीखें",
      });
    }

    const tips = priorities.map((p) => `${p.title}: ${p.message}`);

    const learning_suggestion = safeCourse
      ? {
          course_id: safeCourse.course_id,
          title: safeCourse.title,
          category: safeCourse.category,
          reason: `'${safeCourse.title}' कोर्स से आप काम के नए और सुरक्षित तरीके सीख सकते हैं।`,
        }
      : null;

    return {
      greeting,
      summary,
      priorities,
      tips,
      learning_suggestion,
      important_note:
        "याद रखें: काम का मिलना ग्राहकों की मांग पर निर्भर करता है। हमेशा सुरक्षित काम करें।",
      confidence: "MEDIUM",
      disclaimer: reason
        ? `मंच के आंकड़ों पर आधारित मार्गदर्शन (${reason})`
        : "वास्तविक प्लेटफॉर्म डेटा पर आधारित सलाह",
      is_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  // ----------------------------------------------------
  // GUJARATI DETERMINISTIC RESPONSE (Pure Gujarati)
  // ----------------------------------------------------
  if (language === "gu") {
    const greeting = firstName
      ? `નમસ્તે ${firstName}ભાઈ 👋`
      : "નમસ્તે કારીગર મિત્ર 👋";

    let summary = isHighDemand
      ? `તમારા વિસ્તારમાં ${context.worker_trade}ના કામની માંગ અત્યારે વધારે છે.`
      : `તમારા વિસ્તારમાં ${context.worker_trade}નું કામ સામાન્ય રીતે ચાલી રહ્યું છે.`;

    if (context.is_new_worker) {
      summary = "તમે KaushalyaSetu પર નવા કારીગર મિત્ર છો. તમારી પ્રોફાઇલ તૈયાર કરવામાં હું મદદ કરીશ.";
    }

    const priorities: WorkerAiPriority[] = [];

    // 1. Immediate work opportunity
    if (isUnderUtilized) {
      priorities.push({
        type: "AVAILABILITY",
        title: "કામની તક",
        message: "તમારા પાસે હાલમાં ઓછું કામ આવ્યું છે. જો તમે તૈયાર હોવ તો તમારી ઉપલબ્ધતા (Availability) ON રાખો.",
        action: "ઉપલબ્ધતા ચકાસો",
      });
    } else if (isHighUtilized) {
      priorities.push({
        type: "PERFORMANCE",
        title: "આરામ અને ગુણવત્તા",
        message: "તમે હાલમાં ઘણું કામ કર્યું છે. કામની સારી ગુણવત્તા જાળવવા માટે પૂરતો સમય અને આરામ રાખો.",
      });
    } else {
      priorities.push({
        type: "WORK_OPPORTUNITY",
        title: "કામની તક",
        message: isHighDemand
          ? `તમારા વિસ્તારમાં ${context.worker_trade}ના કામની સારી માંગ છે. ઉપલબ્ધતા ON રાખો.`
          : "નવા ઓર્ડર સમયસર મેળવવા માટે તમારું શિડ્યુલ નિયમિત જોતા રહો.",
        action: "ઉપલબ્ધતા ચકાસો",
      });
    }

    // 2. Performance
    if (context.rating >= 4.5 && (context.reviews_count ?? 0) > 0) {
      priorities.push({
        type: "PERFORMANCE",
        title: "ઉત્તમ સેવા",
        message: `તમારું રેટિંગ ${context.rating} ઉત્તમ છે. ગ્રાહકો સાથે સમયસર પહોંચવું અને નમ્ર વાતચીત ચાલુ રાખો.`,
      });
    } else if (context.is_new_worker) {
      priorities.push({
        type: "PROFILE",
        title: "પ્રોફાઇલ પૂર્ણ કરો",
        message: "તમારા મુખ્ય કૌશલ્ય અને અનુભવ ઉમેરો જેથી ગ્રાહકોનો વિશ્વાસ વધે.",
        action: "પ્રોફાઇલ જુઓ",
      });
    } else {
      priorities.push({
        type: "PERFORMANCE",
        title: "ગ્રાહક સંતોષ",
        message: "કામ પૂરું થયા પછી ગ્રાહક સાથે સ્પષ્ટ વાત કરો અને પ્રતિસાદ આપવા વિનંતી કરો.",
      });
    }

    // 3. Earnings (No false guarantees)
    priorities.push({
      type: "EARNINGS",
      title: "કમાણીની તકો",
      message: isHighDemand
        ? "વિસ્તારમાં માંગ સારી હોવાથી સમયસર કામ સ્વીકારવાથી આવક વધવાની સારી તક રહે છે."
        : "નિયમિત ઉપલબ્ધતા અને સારું રેટિંગ રાખવાથી સતત કામ મેળવવામાં મદદ મળે છે.",
    });

    // 4. Trade-safe Skill Recommendation
    if (safeCourse) {
      priorities.push({
        type: "SKILL",
        title: "કૌશલ્ય વિકાસ",
        message: `'${safeCourse.title}' કોર્સ તમારા ${context.worker_trade}ના કામ માટે ઘણો ઉપયોગી રહેશે.`,
        action: "કોર્સ શીખો",
      });
    }

    const tips = priorities.map((p) => `${p.title}: ${p.message}`);

    const learning_suggestion = safeCourse
      ? {
          course_id: safeCourse.course_id,
          title: safeCourse.title,
          category: safeCourse.category,
          reason: `'${safeCourse.title}' કોર્સ શીખવાથી તમારા કામની નવી તકનીકો શીખી શકાશે.`,
        }
      : null;

    return {
      greeting,
      summary,
      priorities,
      tips,
      learning_suggestion,
      important_note:
        "ધ્યાન રાખો: વધુ કામ લેતા પહેલા તમારી તૈયારી અને આરામનો સમય જરૂર જુઓ.",
      confidence: "MEDIUM",
      disclaimer: reason
        ? `પ્લેટફોર્મ આધારિત માર્ગદર્શન (${reason})`
        : "વાસ્તવિક પ્લેટફોર્મ ડેટા પર આધારિત સલાહ",
      is_fallback: true,
      generated_at: new Date().toISOString(),
    };
  }

  // ----------------------------------------------------
  // ENGLISH DETERMINISTIC RESPONSE
  // ----------------------------------------------------
  const greeting = firstName ? `Hello ${firstName} 👋` : "Hello Partner 👋";

  let summary = isHighDemand
    ? `${context.worker_trade} demand is currently high in your area.`
    : `${context.worker_trade} demand is steady in your local cooperative area.`;

  if (context.is_new_worker) {
    summary = "Welcome to KaushalyaSetu. I am here to help you set up your profile and grow your trade work.";
  }

  const priorities: WorkerAiPriority[] = [];

  // 1. Immediate work opportunity
  if (isUnderUtilized) {
    priorities.push({
      type: "AVAILABILITY",
      title: "Work Opportunity",
      message: "You have had fewer jobs recently. If you are ready for work, keep your availability status ON.",
      action: "Check Availability",
    });
  } else if (isHighUtilized) {
    priorities.push({
      type: "PERFORMANCE",
      title: "Rest and Quality",
      message: "You have been handling many jobs recently. Keep enough time between jobs so service quality does not suffer.",
    });
  } else {
    priorities.push({
      type: "WORK_OPPORTUNITY",
      title: "Work Opportunity",
      message: isHighDemand
        ? `Local demand for ${context.worker_trade} is elevated. Keeping availability ON helps customers find you.`
        : "Check your schedule regularly to receive suitable incoming requests.",
      action: "Check Availability",
    });
  }

  // 2. Performance
  if (context.rating >= 4.5 && (context.reviews_count ?? 0) > 0) {
    priorities.push({
      type: "PERFORMANCE",
      title: "High Service Quality",
      message: `Your rating is strong at ${context.rating}. Continue your prompt arrival and clear communication.`,
    });
  } else if (context.is_new_worker) {
    priorities.push({
      type: "PROFILE",
      title: "Complete Profile",
      message: "Add your key skills, past experience, and accurate phone number to build customer confidence.",
      action: "View Profile",
    });
  } else {
    priorities.push({
      type: "PERFORMANCE",
      title: "Customer Satisfaction",
      message: "Always explain your completed work clearly to customers and politely request feedback.",
    });
  }

  // 3. Earnings potential (No false promises)
  priorities.push({
    type: "EARNINGS",
    title: "Earning Potential",
    message: isHighDemand
      ? "High local demand may create more work opportunities when your schedule is kept up to date."
      : "Providing reliable service and maintaining high ratings helps secure repeat work opportunities.",
  });

  // 4. Trade-safe Skill Recommendation
  if (safeCourse) {
    priorities.push({
      type: "SKILL",
      title: "Skill Upgrade",
      message: `'${safeCourse.title}' is a practical course directly relevant to your ${context.worker_trade} work.`,
      action: "Start Learning",
    });
  }

  const tips = priorities.map((p) => `${p.title}: ${p.message}`);

  const learning_suggestion = safeCourse
    ? {
        course_id: safeCourse.course_id,
        title: safeCourse.title,
        category: safeCourse.category,
        reason: `Master practical skills with '${safeCourse.title}' in KaushalGrow.`,
      }
    : null;

  return {
    greeting,
    summary,
    priorities,
    tips,
    learning_suggestion,
    important_note:
      "Please note: Work opportunities depend on customer requests in your area. Always manage your schedule safely.",
    confidence: "MEDIUM",
    disclaimer: reason
      ? `Advisory guidance (${reason})`
      : "Grounded guidance based on real platform activity.",
    is_fallback: true,
    generated_at: new Date().toISOString(),
  };
}
