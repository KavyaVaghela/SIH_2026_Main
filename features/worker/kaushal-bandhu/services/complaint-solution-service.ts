import type {
  WorkerCustomerComplaintItem,
  WorkerComplaintSolution,
  WorkerAiLanguage,
} from "@/lib/ai/ai-types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 12000;

/**
 * High-Quality Deterministic Alternative Answers for Different Complaints
 * Triggered automatically when AI quota/rate-limits are reached or offline.
 */
export function generateComplaintSolutionFallback(
  complaint: WorkerCustomerComplaintItem,
  language: WorkerAiLanguage = "hi",
  reason?: string
): WorkerComplaintSolution {
  const cat = (complaint.category || "").toLowerCase();
  const sub = (complaint.subcategory || "").toLowerCase();
  const subj = (complaint.subject || "").toLowerCase();
  const desc = (complaint.description || "").toLowerCase();
  const combined = `${cat} ${sub} ${subj} ${desc}`;

  // 1. Water leakage, repair defect, service quality
  const isQualityOrLeak =
    combined.includes("leak") ||
    combined.includes("seep") ||
    combined.includes("quality") ||
    combined.includes("defect") ||
    combined.includes("broken") ||
    combined.includes("loose") ||
    combined.includes("damage");

  // 2. Delay, punctuality, late arrival, scheduling
  const isPunctualityOrDelay =
    combined.includes("late") ||
    combined.includes("delay") ||
    combined.includes("punctual") ||
    combined.includes("time") ||
    combined.includes("schedule") ||
    combined.includes("reach");

  // 3. Billing, overcharging, payment, material cost
  const isBillingOrPrice =
    combined.includes("price") ||
    combined.includes("bill") ||
    combined.includes("payment") ||
    combined.includes("charge") ||
    combined.includes("extra") ||
    combined.includes("cost") ||
    combined.includes("material") ||
    combined.includes("refusal") ||
    combined.includes("money");

  // 4. Safety or code violation
  const isSafetyHazard =
    combined.includes("safe") ||
    combined.includes("hazard") ||
    combined.includes("shock") ||
    combined.includes("fire") ||
    combined.includes("wire") ||
    combined.includes("valve") ||
    combined.includes("gear");

  const nowIso = new Date().toISOString();

  // -------------------------------------------------------------
  // HINDI ALTERNATIVE RESOLUTIONS (हिंदी)
  // -------------------------------------------------------------
  if (language === "hi") {
    if (isQualityOrLeak) {
      return {
        complaint_id: complaint.id,
        complaint_number: complaint.complaint_number,
        category: complaint.category,
        subject: complaint.subject,
        summary: "कार्य गुणवत्ता व रिसाव संबंधी ग्राहक शिकायत का निष्पक्ष समाधान मार्गदर्शन।",
        root_cause_analysis:
          "सेवा पूर्ण होने के बाद पानी के दबाव या कपलिंग सील के ढीले होने से सूक्ष्म रिसाव हो सकता है। प्राथमिक परीक्षण में सब ठीक था, परंतु निरंतर दबाव में यह समस्या सामने आई है।",
        suggested_worker_statement: `महोदय, मैंने नियत समय पर सहकारी मानकों के अनुसार कार्य निष्पादित किया था। परीक्षण के समय कार्य सुचारू था, परंतु ग्राहक महोदय की असुविधा का संज्ञान लेते हुए, मैं बिना किसी अतिरिक्त मज़दूरी शुल्क के पुनः निरीक्षण व सुधार करने के लिए पूर्णतः तत्पर हूँ। कृपया मुझे ग्राहक से समन्वय की अनुमति प्रदान करें।`,
        action_steps: [
          {
            title: "निःशुल्क पुनः निरीक्षण",
            description: "24 घंटे के भीतर ग्राहक से समय लेकर साइट पर रिसाव बिंदु व सील की जांच करें।",
            timeline: "24 घंटे के भीतर",
          },
          {
            title: "सील व वाशर प्रतिस्थापन",
            description: "प्रमाणित टेफ्लॉन टेप या रबर वाशर बदलकर जोड़ को उचित टॉर्क पर कसें।",
            timeline: "साइट विज़िट पर",
          },
          {
            title: "सत्यापन व फोटो प्रमाण",
            description: "10 मिनट तक दबाव परीक्षण करें और ऐप में ग्राहक की डिजिटल संतुष्टि दर्ज करें।",
            timeline: "काम समाप्त होने पर",
          },
        ],
        prevention_tips: [
          "भविष्य में काम खत्म करने से पहले कम से कम 5 मिनट जल प्रवाह परीक्षण अवश्य करें।",
          "काम पूरा होने के तुरंत बाद ग्राहक को अपनी आँखों से कार्य स्थल का निरीक्षण करवाएँ।",
        ],
        federation_governance_guideline:
          "सहकारी नियमावली अनुसार कारीगर द्वारा 72 घंटे में समाधान प्रस्तुत करने पर सेवा रेटिंग पर नकारात्मक प्रभाव नहीं पड़ता।",
        is_fallback: true,
        fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
        generated_at: nowIso,
      };
    }

    if (isPunctualityOrDelay) {
      return {
        complaint_id: complaint.id,
        complaint_number: complaint.complaint_number,
        category: complaint.category,
        subject: complaint.subject,
        summary: "समय पर न पहुँच पाने व देरी संबंधी शिकायत का समाधान व वक्तव्य ड्राफ्ट।",
        root_cause_analysis:
          "पिछले काम पर अप्रत्याशित तकनीकी जटिलता अथवा आवागमन में अप्रत्याशित जाम के कारण समय पर न पहुँच पाना। ग्राहक को अग्रिम सूचना न देना मुख्य चूक रही।",
        suggested_worker_statement: `आदरणीय फेडरेशन अधिकारी, मैं निर्धारित समय पर पहुँचने हेतु पूर्णतः प्रयासरत था। पूर्व असाइनमेंट पर अप्रत्याशित तकनीकी खराबी एवं मार्ग में ट्रैफिक के कारण लगभग 45 मिनट का विलंब हुआ। मैं स्वीकार करता हूँ कि मुझे ऐप द्वारा ग्राहक को पहले सूचित करना चाहिए था। मैं इस असुविधा के लिए ग्राहक महोदय से क्षमा प्रार्थी हूँ।`,
        action_steps: [
          {
            title: "सहकारी मध्यस्थता में वक्तव्य दर्ज करना",
            description: "ग्रीवेंस पोर्टल में विलंब का उचित कारण व यात्रा विवरण दर्ज करें।",
            timeline: "आज ही",
          },
          {
            title: "ग्राहक से शिष्ट संवाद",
            description: "ग्राहक से संपर्क कर विनम्रतापूर्वक खेद व्यक्त करें और अगली सेवा हेतु प्राथमिकता दें।",
            timeline: "तत्काल",
          },
        ],
        prevention_tips: [
          "यदि किसी काम में 15 मिनट से अधिक की देरी संभावित हो, तो तुरंत ऐप में ETA अपडेट करें।",
          "दो असाइनमेंट के बीच कम से कम 30 मिनट का सुरक्षित बफर समय रखें।",
        ],
        federation_governance_guideline:
          "अग्रिम सूचना देने पर समय संबंधी शिकायतों में कारीगर को रियायत दी जाती है।",
        is_fallback: true,
        fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
        generated_at: nowIso,
      };
    }

    if (isBillingOrPrice) {
      return {
        complaint_id: complaint.id,
        complaint_number: complaint.complaint_number,
        category: complaint.category,
        subject: complaint.subject,
        summary: "अतिरिक्त सामग्री व बिलिंग विवाद का पारदर्शी समाधान व बिल सत्यापन।",
        root_cause_analysis:
          "काम के दौरान पुरानी सामग्री खराब मिलने पर अतिरिक्त कलपुर्जे लगाने पड़े। ग्राहक को मौखिक बताया गया परंतु ऐप में लिखित डिजिटल स्वीकृति दर्ज नहीं की गई।",
        suggested_worker_statement: `महोदय, काम के दौरान सुरक्षा व दीर्घकालिक संचालन हेतु अतिरिक्त पार्ट की आवश्यकता थी। मैंने ग्राहक को मौखिक रूप से अवगत कराया था, परंतु ऐप में कोटेशन अपडेट न करना प्रक्रियात्मक भूल थी। मैं बाज़ार से खरीदे गए पार्ट्स का पक्का जीएसटी बिल प्रस्तुत कर रहा हूँ ताकि फेडरेशन पारदर्शी दर की पुष्टि कर सके।`,
        action_steps: [
          {
            title: "पक्के बिल व रसीद संलग्न करना",
            description: "दुकानदार से प्राप्त मूल इनवॉइस की स्पष्ट फोटो ग्रीवेंस पोर्टल में अपलोड करें।",
            timeline: "12 घंटे के भीतर",
          },
          {
            title: "लाइसेंस प्राप्त सहकारी दर सूची सत्यापन",
            description: "फेडरेशन की मानक दर सूची के अनुसार अतिरिक्त मूल्य का मिलान करवाएँ।",
            timeline: "मध्यस्थता बैठक में",
          },
        ],
        prevention_tips: [
          "₹100 से अधिक की किसी भी अतिरिक्त सामग्री के लिए ऐप में 'Revised Estimate' बनाकर ग्राहक की स्वीकृति लें।",
          "हमेशा पक्का कैश मेमो या बिल संभाल कर रखें।",
        ],
        federation_governance_guideline:
          "सहकारी फेडरेशन द्वारा सत्यापित पक्का बिल प्रस्तुत करने पर अतिरिक्त राशि का निपटारा सुगमता से होता है।",
        is_fallback: true,
        fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
        generated_at: nowIso,
      };
    }

    // Default / General Dispute in Hindi
    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: "सहकारी आचार संहिता व ग्राहक संवाद समन्वय समाधान।",
      root_cause_analysis:
        "काम की अपेक्षाओं व कार्य सीमा को लेकर ग्राहक एवं कारीगर के बीच संवाद का अंतर उत्पन्न हुआ।",
      suggested_worker_statement: `आदरणीय फेडरेशन अनुशासन समिति, मैं सहकारी मंच का एक निष्ठावान कारीगर हूँ। कार्यस्थल पर ग्राहक महोदय के साथ कार्य विस्तार को लेकर कुछ भ्रम की स्थिति बनी थी। मेरा इरादा किसी भी प्रकार का अनादर करने का नहीं था। मैं फेडरेशन के निष्पक्ष दिशा-निर्देशों का पूर्ण सम्मान करता हूँ।`,
      action_steps: [
        {
          title: "निष्पक्ष वक्तव्य प्रस्तुति",
          description: "विवाद पोर्टल में अपना पक्ष स्पष्ट और संतुलित भाषा में जमा करें।",
          timeline: "24 घंटे में",
        },
        {
          title: "कौशल विकास मॉड्यूल",
          description: "कौशल ग्रो पर ग्राहक संवाद का 15 मिनट का वीडियो देखकर अपनी प्रोफ़ाइल मजबूत करें।",
          timeline: "इस सप्ताह",
        },
      ],
      prevention_tips: [
        "काम शुरू करने से ठीक पहले काम के बिंदुओं को ग्राहक के सामने दोहराएँ।",
        "शालीन व विनम्र भाषा का प्रयोग ही कारीगर की सबसे बड़ी पूँजी है।",
      ],
      federation_governance_guideline:
        "फेडरेशन दोनों पक्षों की बात सुनकर सौहार्दपूर्ण समाधान निकालती है।",
      is_fallback: true,
      fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
      generated_at: nowIso,
    };
  }

  // -------------------------------------------------------------
  // GUJARATI ALTERNATIVE RESOLUTIONS (ગુજરાતી)
  // -------------------------------------------------------------
  if (language === "gu") {
    if (isQualityOrLeak) {
      return {
        complaint_id: complaint.id,
        complaint_number: complaint.complaint_number,
        category: complaint.category,
        subject: complaint.subject,
        summary: "સેવા ગુણવત્તા અને લીકેજ અંગે ગ્રાહક ફરિયાદનું સચોટ માર્ગદર્શન.",
        root_cause_analysis:
          "પાણીના દબાણ અથવા વોશર સીટિંગના કારણે સમારકામ પછી ધીમો લીકેજ થવાની શક્યતા રહે છે. પ્રાથમિક ટેસ્ટિંગ વખતે કોઈ ખામી જણાઈ ન હતી.",
        suggested_worker_statement: `સાહેબ, મેં સહકારી ધારાધોરણો મુજબ પ્રામાણિકતાથી કામ પૂરું કર્યું હતું. ગ્રાહકની રજૂઆતને માન આપીને હું કોઈપણ વધારાના મજૂરી ખર્ચ વિના ફરીથી તપાસ કરી યોગ્ય સમારકામ કરવા તૈયાર છું. કૃપા કરીને મને ગ્રાહક સાથે મુલાકાત ગોઠવવાની મંજૂરી આપશો.`,
        action_steps: [
          {
            title: "વિનામૂલ્યે પુનઃ તપાસ",
            description: "ગ્રાહકનો સંપર્ક કરી 24 કલાકમાં સાઇટ પર જઈ જોઈન્ટ અને સીલિંગ ચકાસો.",
            timeline: "24 કલાકમાં",
          },
          {
            title: "નવા પાર્ટ્સ ફિટિંગ",
            description: "નવી ટેફલોન ટેપ અથવા વોશર લગાવી લીકેજ સંપૂર્ણ બંધ કરો.",
            timeline: "મુલાકાત વખતે",
          },
        ],
        prevention_tips: [
          "કામ પૂરું કર્યા પછી હંમેશાં 5 થી 10 મિનિટ દબાણ ચકાસણી કરો.",
          "ગ્રાહકને રૂબરૂ કામ બતાવીને જ એપમાં કાર્ય પૂર્ણ માર્ક કરો.",
        ],
        federation_governance_guideline:
          "72 કલાકમાં સંતોષકારક ઉકેલ લાવવાથી કારીગરના રેટિંગ સુરક્ષિત રહે છે.",
        is_fallback: true,
        fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
        generated_at: nowIso,
      };
    }

    if (isPunctualityOrDelay) {
      return {
        complaint_id: complaint.id,
        complaint_number: complaint.complaint_number,
        category: complaint.category,
        subject: complaint.subject,
        summary: "સમયસર ન પહોંચવા અને વિલંબ અંગેનું નિવેદન માર્ગદર્શન.",
        root_cause_analysis:
          "અગાઉના કામમાં અણધારી જટિલતા અથવા ટ્રાફિકના કારણે પહોંચવામાં વિલંબ થયો હતો. ગ્રાહકને સમયસર જાણ ન થવી તે મુખ્ય ભૂલ રહી.",
        suggested_worker_statement: `આદરણીય ફેડરેશન અધિકારીશ્રી, અગાઉના કામમાં મુશ્કેલી આવવાથી નિર્ધારિત સમયે પહોંચવામાં 40 મિનિટનો વિલંબ થયો હતો. ગ્રાહકને અગાઉથી જાણ ન કરી શક્યો તે માટે હું દિલગીર છું. ભવિષ્યમાં સમયપાલનની સંપૂર્ણ કાળજી રાખીશ.`,
        action_steps: [
          {
            title: "સત્તાવાર સ્પષ્ટતા સબમિટ કરવી",
            description: "ગ્રીવન્સ પોર્ટલમાં વિલંબનું કારણ અને વાસ્તવિક પરિસ્થિતિ નોંધો.",
            timeline: "આજે જ",
          },
          {
            title: "ગ્રાહક સાથે વિનમ્ર વાતચીત",
            description: "ગ્રાહકનો સંપર્ક કરી દિલગીરી વ્યક્ત કરવી.",
            timeline: "તાત્કાલિક",
          },
        ],
        prevention_tips: [
          "જો 15 મિનિટથી વધુ મોડું થવાનું હોય તો તરત જ એપમાં સ્ટેટસ અપડેટ કરો.",
          "બે કામ વચ્ચે પૂરતો સમય રાખો.",
        ],
        federation_governance_guideline:
          "અગાઉથી માહિતી આપવાથી સમય વિલંબની ફરિયાદોમાં સહાનુભૂતિપૂર્વક વિચારણા થાય છે.",
        is_fallback: true,
        fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
        generated_at: nowIso,
      };
    }

    // Default Gujarati
    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: "સહકારી નિયમો મુજબ ફરિયાદ નિવારણ માર્ગદર્શન.",
      root_cause_analysis:
        "કામની અપેક્ષા અને વાતચીતમાં ગેરસમજ થવાથી આ ફરિયાદ ઉદ્ભવી છે.",
      suggested_worker_statement: `સાહેબ, હું સહકારી પ્લેટફોર્મનો વફાદાર કારીગર છું. ગ્રાહક સાથે કોઈ ગેરવર્તણૂક કરવાનો મારો ઈરાદો ન હતો. ફેડરેશનના કોઈપણ નિર્ણય અને મધ્યસ્થી માટે હું સહકાર આપવા તૈયાર છું.`,
      action_steps: [
        {
          title: "સ્પષ્ટતા નોંધણી",
          description: "પોતાનો પક્ષ શાંત અને સભ્ય ભાષામાં પોર્ટલ પર દાખલ કરો.",
          timeline: "24 કલાકમાં",
        },
      ],
      prevention_tips: ["કામ શરૂ કરતાં પહેલાં ગ્રાહક સાથે તમામ બાબતો સ્પષ્ટ કરી લો."],
      federation_governance_guideline: "ફેડરેશન બંને પક્ષોને સાંભળીને ન્યાયી ફેંસલો કરે છે.",
      is_fallback: true,
      fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
      generated_at: nowIso,
    };
  }

  // -------------------------------------------------------------
  // ENGLISH ALTERNATIVE RESOLUTIONS (English)
  // -------------------------------------------------------------
  if (isQualityOrLeak) {
    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: "Service quality and post-repair leakage conciliation guidance.",
      root_cause_analysis:
        "Post-repair settling of compression fittings or unexpected water pressure fluctuation can cause minor seepage even when initial pressure testing passed.",
      suggested_worker_statement: `I completed the service as per standard cooperative guidelines on the scheduled date. During the initial handover test, no leakage was observed. However, respecting the customer's observation regarding subsequent seepage, I request the Federation arbitration desk to allow a courtesy follow-up inspection at no extra labor cost to examine the joint and ensure total customer satisfaction.`,
      action_steps: [
        {
          title: "Complimentary Re-Inspection",
          description: "Coordinate with the customer to inspect the joint and seal within 24 hours.",
          timeline: "Within 24 hours",
        },
        {
          title: "Seal & Washer Replacement",
          description: "Replace gasket or re-apply Teflon thread seal to specification.",
          timeline: "On-site visit",
        },
        {
          title: "Pressure Verification & Photo Sign-Off",
          description: "Run 10-minute continuous flow test and capture digital handover photo.",
          timeline: "At job completion",
        },
      ],
      prevention_tips: [
        "Always perform a 5-minute continuous water run test before closing plumbing tasks.",
        "Take timestamped before-and-after photos of joints in the KaushalyaSetu mobile app.",
      ],
      federation_governance_guideline:
        "Cooperative charter guarantees free rectification within 72 hours without penalty to worker performance tier.",
      is_fallback: true,
      fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
      generated_at: nowIso,
    };
  }

  if (isPunctualityOrDelay) {
    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: "Punctuality and schedule delay response guidance.",
      root_cause_analysis:
        "Transit delay caused by traffic congestion or previous emergency work overrunning. The key procedural lapse was lack of proactive in-app customer notification.",
      suggested_worker_statement: `I sincerely regret the delay in reaching the customer's location for the scheduled appointment. My previous cooperative dispatch involved emergency isolation that took longer than anticipated. While I attempted to travel promptly, I recognize that I should have alerted the customer via the app earlier. I respectfully submit this statement and commit to offering priority scheduling for their next booking.`,
      action_steps: [
        {
          title: "Submit Statement in Grievance Portal",
          description: "Record explanation with transit context for Federation officer review.",
          timeline: "Within 12 hours",
        },
        {
          title: "Polite Customer Outreach",
          description: "Reach out respectfully to apologize for the scheduling inconvenience.",
          timeline: "Immediate",
        },
      ],
      prevention_tips: [
        "Send an in-app ETA update at least 30 minutes before appointment if running 15+ minutes late.",
        "Maintain a 30-minute buffer window between consecutive bookings.",
      ],
      federation_governance_guideline:
        "Punctuality disputes resolved through cooperative conciliation preserve worker dispatch eligibility.",
      is_fallback: true,
      fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
      generated_at: nowIso,
    };
  }

  if (isBillingOrPrice) {
    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: "Material cost and pricing discrepancy conciliation guidance.",
      root_cause_analysis:
        "Onsite inspection revealed worn components requiring replacement parts. Verbal consent was communicated but digital estimate approval was omitted in the app.",
      suggested_worker_statement: `During the service, additional replacement parts were necessary to ensure code safety and prevent future breakdown. I explained this verbally onsite; however, I understand that formal written digital consent in the app should have preceded installation. I provide itemized store receipts for the parts and propose that the Federation verify standard wholesale pricing.`,
      action_steps: [
        {
          title: "Upload Original Invoices",
          description: "Attach clear photographs of the store receipts to the grievance portal.",
          timeline: "Within 24 hours",
        },
        {
          title: "Cooperative Tariff Reconciliation",
          description: "Allow federation officer to verify parts pricing against benchmark catalog.",
          timeline: "Conciliation review",
        },
      ],
      prevention_tips: [
        "Never purchase parts above ₹100 without customer's in-app digital estimate approval.",
        "Always keep store receipts and hand duplicates to customer.",
      ],
      federation_governance_guideline:
        "Transparent receipt submission expedites dispute closure through cooperative arbitration.",
      is_fallback: true,
      fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
      generated_at: nowIso,
    };
  }

  // General English fallback
  return {
    complaint_id: complaint.id,
    complaint_number: complaint.complaint_number,
    category: complaint.category,
    subject: complaint.subject,
    summary: "Impartial Federation arbitration and customer conciliation guidance.",
    root_cause_analysis:
      "A difference in expectations regarding job scope or service delivery terms occurred between the parties.",
    suggested_worker_statement: `I am committed to providing high quality service as a member of the Cooperative Federation. I value customer feedback and respectfully present this perspective for impartial Federation review. I am fully willing to participate in constructive conciliation to achieve an equitable resolution.`,
    action_steps: [
      {
        title: "Submit Statement for Federation Record",
        description: "Draft your perspective calmly and submit through the grievance portal.",
        timeline: "Within 24 hours",
      },
      {
        title: "Participate in Conciliation",
        description: "Attend scheduled arbitration call with Federation dispute officer.",
        timeline: "As scheduled",
      },
    ],
    prevention_tips: [
      "Review the scope of work verbally with the customer upon arrival.",
      "Maintain professional and courteous communication at all times.",
    ],
    federation_governance_guideline:
      "KaushalyaBandhu provides neutral statement assistance. The Cooperative Federation makes all official resolution decisions.",
    is_fallback: true,
    fallback_reason: reason || "AI Quota Reserve Activated (Deterministic Cooperative Model)",
    generated_at: nowIso,
  };
}

/**
 * Calls Groq LLM to generate tailor-made AI grievance resolution advice for the worker.
 * If Groq fails (quota, rate limit 429, timeout), automatically falls back to deterministic resolution.
 */
export async function generateAiComplaintSolution(
  complaint: WorkerCustomerComplaintItem,
  workerContext: { trade?: string; name?: string },
  language: WorkerAiLanguage = "hi"
): Promise<WorkerComplaintSolution> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return generateComplaintSolutionFallback(
      complaint,
      language,
      "GROQ_API_KEY not configured"
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const languageDirective =
      language === "hi"
        ? `CRITICAL LANGUAGE REQUIREMENT (HINDI):
The ENTIRE JSON response (summary, root_cause_analysis, suggested_worker_statement, action_steps, prevention_tips, federation_governance_guideline) MUST be in natural, everyday HINDI in standard Devanagari script (हिंदी). Do NOT mix English sentences. Easy to understand for a skilled artisan.`
        : language === "gu"
        ? `CRITICAL LANGUAGE REQUIREMENT (GUJARATI):
The ENTIRE JSON response MUST be in natural, everyday GUJARATI in Gujarati script (ગુજરાતી). Do NOT mix English sentences.`
        : `CRITICAL LANGUAGE REQUIREMENT (ENGLISH):
The ENTIRE JSON response MUST be in simple, professional, plain ENGLISH without corporate jargon.`;

    const systemPrompt = `You are the "Kaushal Bandhu Grievance & Conciliation Advisor" on KaushalyaSetu, a cooperative-owned service platform.
Your purpose is to assist a skilled worker (${workerContext.trade || "artisan"}) who has received a customer complaint or feedback dispute.

${languageDirective}

ARBITRATION PRINCIPLES:
1. Impartiality & Dignity: Help the worker respond with dignity, professionalism, and calmness without admitting false blame.
2. De-escalation: Propose practical conciliation (e.g. prompt re-inspection, courtesy repair, clear invoice verification).
3. Ready-to-Submit Statement: Write a respectful, clear first-person statement that the worker can copy and submit directly to the Cooperative Federation arbitration officer.
4. Actionable Steps: Provide 2 to 3 chronological steps the worker should take today.
5. Prevention: Provide 2 practical tips to prevent this issue in future gigs.
6. Neutral Note: State that Federation officers make the final binding determination.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "summary": "1 to 2 sentence executive summary of the resolution approach in requested language",
  "root_cause_analysis": "1 to 2 sentences explaining why this dispute likely occurred from a technical/service perspective in requested language",
  "suggested_worker_statement": "Polished, respectful 2-4 sentence first-person statement for the worker to submit to the Federation in requested language",
  "action_steps": [
    {
      "title": "Short title (3-5 words) in requested language",
      "description": "Concrete action details in requested language",
      "timeline": "e.g., '24 घंटे के भीतर' / 'Within 24h'"
    }
  ],
  "prevention_tips": [
    "Tip 1 in requested language",
    "Tip 2 in requested language"
  ],
  "federation_governance_guideline": "Brief reminder of cooperative dispute policy in requested language"
}`;

    const userPrompt = JSON.stringify({
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subcategory: complaint.subcategory,
      subject: complaint.subject,
      customer_description: complaint.description,
      customer_name: complaint.customer_name,
      status: complaint.status,
      priority: complaint.priority,
      worker_name: workerContext.name || "Worker",
      worker_trade: workerContext.trade || "Artisan",
      target_language: language,
    });

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Groq HTTP ${response.status}: ${errText.slice(0, 120)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty completion from Groq");
    }

    const parsed = JSON.parse(content);

    return {
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      category: complaint.category,
      subject: complaint.subject,
      summary: parsed.summary || "AI guidance prepared for customer dispute conciliation.",
      root_cause_analysis: parsed.root_cause_analysis || "Discrepancy analyzed against cooperative trade standards.",
      suggested_worker_statement: parsed.suggested_worker_statement || "I respectfully request a courtesy follow-up inspection to resolve this matter.",
      action_steps: Array.isArray(parsed.action_steps) && parsed.action_steps.length > 0
        ? parsed.action_steps
        : [
            {
              title: "Review Statement",
              description: "Review and submit the prepared statement to Federation.",
              timeline: "Within 24h",
            },
          ],
      prevention_tips: Array.isArray(parsed.prevention_tips) && parsed.prevention_tips.length > 0
        ? parsed.prevention_tips
        : ["Confirm task scope before starting work."],
      federation_governance_guideline:
        parsed.federation_governance_guideline ||
        "The Cooperative Federation oversees all grievance evaluations independently.",
      is_fallback: false,
      generated_at: new Date().toISOString(),
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "AI Service unavailable";
    console.warn(`[ComplaintSolutionService] AI call failed (${msg}). Serving fallback solution.`);
    return generateComplaintSolutionFallback(complaint, language, msg);
  }
}
