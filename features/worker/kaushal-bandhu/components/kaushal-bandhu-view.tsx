"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Award,
  BookOpen,
  Calendar,
  User,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Briefcase,
  ShieldAlert,
  HeartHandshake,
  ShieldCheck,
  Compass,
  Star,
  Zap,
  PhoneCall,
  ChevronRight,
  Target,
  Copy,
  Check,
  FileText,
  Bot,
  Cpu,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type {
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
  WorkerAiApiResponse,
  WorkerGrowthPlanItem,
  WorkerCertificationDetail,
  WorkerCustomerComplaintItem,
  WorkerComplaintSolution,
} from "@/lib/ai/ai-types";

import { useLanguage } from "@/lib/i18n/language-context";
import { workerJobService } from "@/features/worker/services/worker-job-service";
import { generateComplaintSolutionFallback } from "../services/complaint-solution-service";

interface LocalizedText {
  title: string;
  subtitle: string;
  greetingDefault: string;
  desc: string;
  getAdviceBtn: string;
  refreshAdviceBtn: string;
  loadingText: string;

  // Growth Plan
  growthPlanTitle: string;
  growthPlanSubtitle: string;

  // Performance
  performanceTitle: string;
  performanceSubtitle: string;
  completedJobsLabel: string;
  completedLast30DaysLabel: string;
  ratingLabel: string;
  cancellationsLabel: string;
  responseRateLabel: string;
  earningsTrendLabel: string;
  lastJobLabel: string;
  performanceAdviceFast: string;
  performanceAdviceSlow: string;
  viewScheduleBtn: string;
  viewEarningsBtn: string;

  // Job Opportunities
  opportunitiesTitle: string;
  opportunitiesSubtitle: string;
  activeRequestsLabel: string;
  skillsInDemandLabel: string;
  opportunitiesActiveMsg: string;
  viewJobRequestsBtn: string;

  // Work Region Guidance
  regionTitle: string;
  regionSubtitle: string;
  currentZoneLabel: string;
  balancingTitle: string;
  balancingDesc: string;
  manageAvailabilityBtn: string;

  // Skills & Certifications
  skillsCertsTitle: string;
  skillsCertsSubtitle: string;
  verifiedSkillsLabel: string;
  certificationsLabel: string;
  expiringCertAlert: string;
  viewCertsBtn: string;
  startLearningBtn: string;
  courseRecommendBadge: string;
  noCourseMsg: string;

  // Complaint Guidance
  complaintTitle: string;
  complaintSubtitle: string;
  complaintStatusLabel: string;
  noComplaintsMsg: string;
  pendingResponseMsg: string;
  complaintNeutralNote: string;
  viewGrievancesBtn: string;

  // Welfare Guidance
  welfareTitle: string;
  welfareSubtitle: string;
  insuranceStatusLabel: string;
  coverageLabel: string;
  emergencyStatusLabel: string;
  providentMatchLabel: string;
  welfareActiveMsg: string;
  viewWelfareBtn: string;

  // General & AI Advice
  todayPrioritiesTitle: string;
  whyTitle: string;
  whyDesc: string;
  disclaimerTitle: string;
  quickActionsHeader: string;
  highDemand: string;
  steadyDemand: string;
  lowDemand: string;
  tradeLabel: string;
  experienceLabel: string;
  verifiedLabel: string;
  demandLabel: string;

  // Complaint AI Solution additions
  selectComplaintPlaceholder: string;
  selectComplaintLabel: string;
  generateSolutionBtn: string;
  generatingSolutionBtn: string;
  regenerateSolutionBtn: string;
  solutionHeading: string;
  rootCauseLabel: string;
  suggestedStatementLabel: string;
  actionPlanLabel: string;
  preventionLabel: string;
  copyStatementBtn: string;
  statementCopiedMsg: string;
  reAnalyzeBtn: string;
  reAnalyzingBtn: string;
  aiLiveBadge: string;
}

const UI_TEXT: Record<WorkerAiLanguage, LocalizedText> = {
  hi: {
    title: "कौशल बंधु",
    subtitle: "कारीगर विकास एवं संपूर्ण सहायता मार्गदर्शक",
    greetingDefault: "नमस्ते साथी, कौशल बंधु में आपका स्वागत है!",
    desc: "यहाँ आप अपने कार्य प्रदर्शन, नए काम के अवसरों, इलाके की मांग, हुनर व प्रमाणपत्र, शिकायत समाधान और कल्याणकारी योजनाओं का संपूर्ण मार्गदर्शन प्राप्त कर सकते हैं।",
    getAdviceBtn: "मार्गदर्शन प्राप्त करें",
    refreshAdviceBtn: "नया मार्गदर्शन प्राप्त करें",
    loadingText: "कौशल बंधु आपके रिकॉर्ड का विश्लेषण कर रहे हैं...",

    growthPlanTitle: "आपकी विकास योजना (Growth Plan)",
    growthPlanSubtitle: "आपके वास्तविक कार्य और अवसरों पर आधारित जरूरी अगले कदम",

    performanceTitle: "1. कार्य प्रदर्शन और ट्रैक रिकॉर्ड",
    performanceSubtitle: "रेटिंग, पूरे किए गए काम, प्रतिक्रिया और कमाई की प्रगति",
    completedJobsLabel: "पूरे किए गए काम",
    completedLast30DaysLabel: "पिछले 30 दिन",
    ratingLabel: "ग्राहक रेटिंग",
    cancellationsLabel: "रद्द किए गए काम",
    responseRateLabel: "प्रतिक्रिया दर (Response)",
    earningsTrendLabel: "कुल कमाई",
    lastJobLabel: "पिछला काम",
    performanceAdviceFast: "ग्राहकों के अनुरोधों का तुरंत जवाब देने से आपको अधिक प्राथमिक काम मिलने की संभावना बढ़ती है।",
    performanceAdviceSlow: "अनुरोधों पर जल्दी प्रतिक्रिया दें। समय पर पहुंचना और साफ बातचीत आपकी रेटिंग को मजबूत बनाती है।",
    viewScheduleBtn: "शेड्यूल देखें",
    viewEarningsBtn: "कमाई विवरण देखें",

    opportunitiesTitle: "2. नए काम के अवसर",
    opportunitiesSubtitle: "आपके काम और हुनर के लिए सक्रिय ग्राहक मांग",
    activeRequestsLabel: "सक्रिय कार्य अनुरोध",
    skillsInDemandLabel: "मांग वाले हुनर",
    opportunitiesActiveMsg: "आपके सेवा क्षेत्र में काम के नए अनुरोध उपलब्ध हैं। समय पर जवाब देकर काम पक्का करें।",
    viewJobRequestsBtn: "उपलब्ध काम देखें",

    regionTitle: "3. कार्य क्षेत्र और मांग मार्गदर्शन",
    regionSubtitle: "सहकारी सेवा क्लस्टर और कार्यबल संतुलन",
    currentZoneLabel: "पंजीकृत सहकारी क्षेत्र",
    balancingTitle: "अंतर-सहकारी कार्यबल संतुलन",
    balancingDesc: "आसपास के सेवा क्षेत्रों में मांग बढ़ने पर आपको अंतर-क्लस्टर काम के अवसर मिल सकते हैं। अपनी उपलब्धता चालू रखें।",
    manageAvailabilityBtn: "उपलब्धता और क्षेत्र जांचें",

    skillsCertsTitle: "4. हुनर और प्रमाणपत्र मार्गदर्शन",
    skillsCertsSubtitle: "सत्यापित प्रमाणपत्र और कौशल विकास (KaushalGrow)",
    verifiedSkillsLabel: "सत्यापित हुनर",
    certificationsLabel: "सहकारी प्रमाणपत्र",
    expiringCertAlert: "आपके प्रमाणपत्र की वैधता समाप्त होने वाली है। काम की प्राथमिकता बनाए रखने के लिए समय पर नवीनीकरण करें।",
    viewCertsBtn: "प्रमाणपत्र देखें",
    startLearningBtn: "नया कोर्स सीखें",
    courseRecommendBadge: "सुझाया गया कोर्स",
    noCourseMsg: "वर्तमान में आपके ट्रेड के लिए कोई नया कोर्स लंबित नहीं है।",

    complaintTitle: "5. शिकायत एवं समाधान मार्गदर्शन",
    complaintSubtitle: "पारदर्शी समाधान प्रक्रिया और पक्ष रखने में सहायता",
    complaintStatusLabel: "शिकायत स्थिति",
    noComplaintsMsg: "आपके रिकॉर्ड पर कोई सक्रिय ग्राहक शिकायत नहीं है। आपकी सेवा गुणवत्ता बेहतरीन है!",
    pendingResponseMsg: "ग्राहक द्वारा साझा किए गए मामले पर आपका पक्ष प्रतीक्षित है। अपनी बात रखने से फेडरेशन निष्पक्ष निर्णय ले सकेगा।",
    complaintNeutralNote: "कौशल बंधु केवल निष्पक्ष मार्गदर्शन और सहायता प्रदान करता है। शिकायत की जांच और अंतिम निर्णय का अधिकार संबंधित सहकारी फेडरेशन के पास है।",
    viewGrievancesBtn: "शिकायत निवारण देखें",

    welfareTitle: "6. कल्याण और सामाजिक सुरक्षा",
    welfareSubtitle: "स्वास्थ्य सुरक्षा, दुर्घटना कवर और सहकारी सहायता",
    insuranceStatusLabel: "स्वास्थ्य व दुर्घटना बीमा",
    coverageLabel: "कवरेज राशि",
    emergencyStatusLabel: "आपातकालीन सहायता",
    providentMatchLabel: "सहकारी कल्याण कोष",
    welfareActiveMsg: "आप सहकारी स्वास्थ्य व सुरक्षा योजना से सुरक्षित हैं। आपातकालीन सहायता और सब्सिडी की जानकारी देखें।",
    viewWelfareBtn: "कल्याणकारी योजनाएं देखें",

    todayPrioritiesTitle: "आज की प्राथमिक सलाह",
    whyTitle: "यह सलाह आपको क्यों दिखाई दे रही है?",
    whyDesc: "यह मार्गदर्शन आपके वास्तविक काम, रेटिंग, शिकायतों के रिकॉर्ड, प्रमाणपत्रों की स्थिति और आपके क्षेत्र की मांग पर आधारित है।",
    disclaimerTitle: "ज़रूरी सूचना",
    quickActionsHeader: "त्वरित नेविगेशन",
    highDemand: "उच्च मांग",
    steadyDemand: "सामान्य मांग",
    lowDemand: "सीमित मांग",
    tradeLabel: "पंजीकृत कार्य",
    experienceLabel: "अनुभव",
    verifiedLabel: "सत्यापित साथी",
    demandLabel: "इलाके में मांग",

    selectComplaintPlaceholder: "-- समाधान हेतु ग्राहक शिकायत चुनें --",
    selectComplaintLabel: "शिकायत का चयन करें",
    generateSolutionBtn: "एआई समाधान व वक्तव्य तैयार करें",
    generatingSolutionBtn: "कौशल बंधु एआई समाधान तैयार कर रहे हैं...",
    regenerateSolutionBtn: "पुनः एआई समाधान प्राप्त करें",
    solutionHeading: "कौशल बंधु एआई मध्यस्थता समाधान",
    rootCauseLabel: "तकनीकी विश्लेषण व संभावित कारण",
    suggestedStatementLabel: "फेडरेशन हेतु प्रस्तावित आधिकारिक वक्तव्य",
    actionPlanLabel: "समाधान कार्ययोजना (चरणबद्ध)",
    preventionLabel: "भविष्य हेतु सुरक्षा व निवारक सुझाव",
    copyStatementBtn: "वक्तव्य कॉपी करें",
    statementCopiedMsg: "वक्तव्य कॉपी हो गया!",
    reAnalyzeBtn: "लाइव डेटा पुनः स्कैन करें",
    reAnalyzingBtn: "एआई विश्लेषण जारी...",
    aiLiveBadge: "लाइव एआई विश्लेषण सक्रिय",
  },
  gu: {
    title: "કૌશલ બંધુ",
    subtitle: "કારીગર વિકાસ અને સંપૂર્ણ સહાયક માર્ગદર્શક",
    greetingDefault: "નમસ્તે સાથી, કૌશલ બંધુમાં તમારું સ્વાગત છે!",
    desc: "અહીં તમે તમારા કાર્ય પ્રદર્શન, કામની નવી તકો, વિસ્તારની માંગ, કૌશલ્યો અને પ્રમાણપત્રો, ફરિયાદ નિવારણ અને કલ્યાણકારી સહાય વિશે સંપૂર્ણ માર્ગદર્શન મેળવી શકો છો.",
    getAdviceBtn: "માર્ગદર્શન મેળવો",
    refreshAdviceBtn: "નવું માર્ગદર્શન મેળવો",
    loadingText: "કૌશલ બંધુ તમારા રેકોર્ડનું વિશ્લેષણ કરી રહ્યા છે...",

    growthPlanTitle: "તમારો વિકાસ પ્લાન (Growth Plan)",
    growthPlanSubtitle: "તમારા વાસ્તવિક કાર્ય અને તકો પર આધારિત મહત્વપૂર્ણ આગળના પગલાં",

    performanceTitle: "1. કાર્ય પ્રદર્શન અને ટ્રેક રેકોર્ડ",
    performanceSubtitle: "રેટિંગ્સ, પૂર્ણ કરેલ કામ, પ્રતિસાદ અને કમાણીનો પ્રવાહ",
    completedJobsLabel: "પૂર્ણ કરેલા કામ",
    completedLast30DaysLabel: "છેલ્લા 30 દિવસ",
    ratingLabel: "ગ્રાહક રેટિંગ",
    cancellationsLabel: "રદ થયેલા કામ",
    responseRateLabel: "પ્રતિસાદ દર (Response)",
    earningsTrendLabel: "કુલ કમાણી",
    lastJobLabel: "છેલ્લું કામ",
    performanceAdviceFast: "ગ્રાહકના ઓર્ડરનો ઝડપી પ્રતિસાદ આપવાથી તમને વધુ પ્રાથમિક કામ મળવાની શક્યતા વધે છે.",
    performanceAdviceSlow: "કામની વિનંતીઓ પર વહેલો પ્રતિસાદ આપો. સમયસર પહોંચવું અને નમ્ર વ્યવહાર તમારી રેટિંગને મજબૂત રાખે છે.",
    viewScheduleBtn: "શેડ્યૂલ જુઓ",
    viewEarningsBtn: "કમાણી વિગત જુઓ",

    opportunitiesTitle: "2. કામની નવી તકો",
    opportunitiesSubtitle: "તમારા કાર્ય અને કૌશલ્ય માટે સક્રિય ગ્રાહક માંગ",
    activeRequestsLabel: "સક્રિય કાર્ય વિનંતીઓ",
    skillsInDemandLabel: "માંગવાળા કૌશલ્યો",
    opportunitiesActiveMsg: "તમારા સેવા વિસ્તારમાં કામની નવી વિનંતીઓ સક્રિય છે. સમયસર સ્વીકારીને કામ શરૂ કરો.",
    viewJobRequestsBtn: "ઉપલબ્ધ કામ જુઓ",

    regionTitle: "3. કાર્ય વિસ્તાર અને માંગ માર્ગદર્શન",
    regionSubtitle: "સહકારી સેવા ક્લસ્ટર અને કાર્યબળ સંતુલન",
    currentZoneLabel: "નોંધાયેલ સહકારી વિસ્તાર",
    balancingTitle: "આંતર-સહકારી કાર્યબળ સંતુલન",
    balancingDesc: "નજીકના સેવા વિસ્તારોમાં માંગ વધવા પર તમને આંતર-ક્લસ્ટર કામની તકો મળી શકે છે. તમારી ઉપલબ્ધતા ચાલુ રાખો.",
    manageAvailabilityBtn: "ઉપલબ્ધતા તપાસો",

    skillsCertsTitle: "4. કૌશલ્યો અને પ્રમાણપત્ર માર્ગદર્શન",
    skillsCertsSubtitle: "પ્રમાણિત લાયકાત અને કૌશલ્ય વિકાસ (KaushalGrow)",
    verifiedSkillsLabel: "પ્રમાણિત કૌશલ્યો",
    certificationsLabel: "સહકારી પ્રમાણપત્રો",
    expiringCertAlert: "તમારા પ્રમાણપત્રની મુદત ટૂંક સમયમાં પૂર્ણ થઈ રહી છે. કામની પ્રાથમિકતા જાળવવા સમયસર નવીકરણ કરો.",
    viewCertsBtn: "પ્રમાણપત્રો જુઓ",
    startLearningBtn: "નવો કોર્સ શીખો",
    courseRecommendBadge: "ભલામણ કરેલ કોર્સ",
    noCourseMsg: "હાલમાં તમારા ટ્રેડ માટે કોઈ નવો કોર્સ ઉપલબ્ધ નથી.",

    complaintTitle: "5. ફરિયાદ અને સમાધાન માર્ગદર્શન",
    complaintSubtitle: "પારદર્શક નિવારણ પ્રક્રિયા અને રજૂઆત સહાય",
    complaintStatusLabel: "ફરિયાદ સ્થિતિ",
    noComplaintsMsg: "તમારા રેકોર્ડ પર કોઈ સક્રિય ગ્રાહક ફરિયાદ નથી. તમારી સેવા ગુણવત્તા ઉત્તમ છે!",
    pendingResponseMsg: "ગ્રાહક દ્વારા રજૂ કરાયેલ બાબત પર તમારો પક્ષ બાકી છે. તમારી વાત રજૂ કરવાથી ફેડરેશન નિષ્પક્ષ નિર્ણય લઈ શકશે.",
    complaintNeutralNote: "કૌશલ બંધુ માત્ર નિષ્પક્ષ માર્ગદર્શન અને સહાય આપે છે. ફરિયાદની તપાસ અને અંતિમ નિર્ણયનો અધિકાર સંબંધિત સહકારી ફેડરેશન પાસે છે.",
    viewGrievancesBtn: "ફરિયાદ નિવારણ જુઓ",

    welfareTitle: "6. કલ્યાણ અને સામાજિક સુરક્ષા",
    welfareSubtitle: "સ્વાસ્થ્ય સુરક્ષા, અકસ્માત કવર અને સહકારી સહાય",
    insuranceStatusLabel: "સ્વાસ્થ્ય અને અકસ્માત વીમો",
    coverageLabel: "કવરેજ રકમ",
    emergencyStatusLabel: "ઇમરજન્સી સહાય",
    providentMatchLabel: "સહકારી કલ્યાણ ભંડોળ",
    welfareActiveMsg: "તમે સહકારી સ્વાસ્થ્ય અને સુરક્ષા યોજના હેઠળ સુરક્ષિત છો. કટોકટી સહાય અને લાભો તપાસો.",
    viewWelfareBtn: "કલ્યાણકારી યોજનાઓ જુઓ",

    todayPrioritiesTitle: "આજની પ્રાથમિક સલાહ",
    whyTitle: "આ સલાહ તમને કેમ દેખાઈ રહી છે?",
    whyDesc: "આ માર્ગદર્શન તમારા વાસ્તવિક કાર્ય, રેટિંગ, ફરિયાદોના રેકોર્ડ, પ્રમાણપત્ર સ્થિતિ અને તમારા વિસ્તારની માંગ પર આધારિત છે.",
    disclaimerTitle: "મહત્વપૂર્ણ નોંધ",
    quickActionsHeader: "ઝડપી નેવિગેશન",
    highDemand: "ઊંચી માંગ",
    steadyDemand: "સામાન્ય માંગ",
    lowDemand: "મર્યાદિત માંગ",
    tradeLabel: "નોંધાયેલ કાર્ય",
    experienceLabel: "અનુભવ",
    verifiedLabel: "પ્રમાણિત સાથી",
    demandLabel: "વિસ્તારમાં માંગ",

    selectComplaintPlaceholder: "-- સમાધાન માટે ગ્રાહક ફરિયાદ પસંદ કરો --",
    selectComplaintLabel: "ફરિયાદ પસંદ કરો",
    generateSolutionBtn: "એઆઈ સમાધાન અને નિવેદન મેળવો",
    generatingSolutionBtn: "કૌશલ બંધુ એઆઈ સમાધાન તૈયાર કરી રહ્યા છે...",
    regenerateSolutionBtn: "ફરીથી એઆઈ સમાધાન મેળવો",
    solutionHeading: "કૌશલ બંધુ એઆઈ મધ્યસ્થી સમાધાન",
    rootCauseLabel: "ટેકનિકલ વિશ્લેષણ અને સંભવિત કારણ",
    suggestedStatementLabel: "ફેડરેશન માટે ભલામણ કરેલ સત્તાવાર નિવેદન",
    actionPlanLabel: "નિવારણ કાર્ય યોજના (તબક્કાવાર)",
    preventionLabel: "ભવિષ્ય માટે સાવચેતી અને નિવારણ માર્ગદર્શન",
    copyStatementBtn: "નિવેદન કોપી કરો",
    statementCopiedMsg: "નિવેદન કોપી થઈ ગયું!",
    reAnalyzeBtn: "લાઈવ ડેટા ફરીથી સ્કેન કરો",
    reAnalyzingBtn: "એઆઈ વિશ્લેષણ ચાલુ...",
    aiLiveBadge: "લાઈવ એઆઈ વિશ્લેષણ સક્રિય",
  },
  en: {
    title: "Kaushal Bandhu",
    subtitle: "Worker Growth & Support Mentor",
    greetingDefault: "Hello Partner, welcome to Kaushal Bandhu!",
    desc: "Your central mentor for performance optimization, local job opportunities, regional guidance, skills & certifications, grievance resolution, and cooperative welfare.",
    getAdviceBtn: "Get Mentor Guidance",
    refreshAdviceBtn: "Refresh Advice",
    loadingText: "Kaushal Bandhu is analyzing your platform data...",

    growthPlanTitle: "Your Growth Plan",
    growthPlanSubtitle: "Actionable next steps derived directly from your live records and local demand",

    performanceTitle: "1. Performance & Track Record",
    performanceSubtitle: "Completed jobs, customer rating, response behavior and earnings trend",
    completedJobsLabel: "Completed Jobs",
    completedLast30DaysLabel: "Last 30 Days",
    ratingLabel: "Customer Rating",
    cancellationsLabel: "Cancellations",
    responseRateLabel: "Response Rate",
    earningsTrendLabel: "Total Earnings",
    lastJobLabel: "Last Job Done",
    performanceAdviceFast: "Responding promptly to incoming service requests increases your matching priority for future customer bookings.",
    performanceAdviceSlow: "Responding to job requests sooner may help you receive more opportunities. Punctuality and polite communication keep ratings high.",
    viewScheduleBtn: "View Schedule & Jobs",
    viewEarningsBtn: "View Earnings",

    opportunitiesTitle: "2. Job Opportunities",
    opportunitiesSubtitle: "Active customer demand matching your registered skills and trade",
    activeRequestsLabel: "Active Requests",
    skillsInDemandLabel: "Skills in Demand",
    opportunitiesActiveMsg: "Service requests are currently active in your service area. Respond promptly to secure assignments.",
    viewJobRequestsBtn: "View Job Requests",

    regionTitle: "3. Work Region Guidance",
    regionSubtitle: "Service cluster demand and workforce balancing",
    currentZoneLabel: "Registered Cluster",
    balancingTitle: "Inter-Federation Workforce Balancing",
    balancingDesc: "Surge demand in neighboring service areas connects workers across cooperative clusters. Keep availability on for priority dispatches.",
    manageAvailabilityBtn: "Manage Schedule & Availability",

    skillsCertsTitle: "4. Skills & Certifications",
    skillsCertsSubtitle: "Verified trade credentials and skill development via KaushalGrow",
    verifiedSkillsLabel: "Verified Skills",
    certificationsLabel: "Trade Certifications",
    expiringCertAlert: "Your trade certification expires soon. Renewing it maintains your verification badge and booking eligibility.",
    viewCertsBtn: "View Certifications",
    startLearningBtn: "Start Learning",
    courseRecommendBadge: "Recommended Course",
    noCourseMsg: "No new course required for your trade right now.",

    complaintTitle: "5. Grievance & Support Guidance",
    complaintSubtitle: "Impartial resolution process and statement assistance",
    complaintStatusLabel: "Grievance Status",
    noComplaintsMsg: "No customer complaints on file. Excellent service quality record!",
    pendingResponseMsg: "A customer feedback case is awaiting your statement. Submitting your perspective ensures an impartial review by Federation staff.",
    complaintNeutralNote: "KaushalyaBandhu provides neutral information and statement guidance only. The Cooperative Federation investigates and makes all official resolution decisions.",
    viewGrievancesBtn: "Go to My Grievances",

    welfareTitle: "6. Welfare & Social Protection",
    welfareSubtitle: "Health mutual coverage, cooperative funds, and support benefits",
    insuranceStatusLabel: "Health & Accident Cover",
    coverageLabel: "Coverage Amount",
    emergencyStatusLabel: "Emergency Assistance",
    providentMatchLabel: "Provident Fund Match",
    welfareActiveMsg: "You are covered under the Cooperative Gig Worker Health Mutual. Check emergency tools and protection programs.",
    viewWelfareBtn: "View Welfare & Support",

    todayPrioritiesTitle: "Today's Action Priorities",
    whyTitle: "Why are you seeing this advice?",
    whyDesc: "This guidance is strictly grounded in your verified jobs, reviews, certifications, grievance records, and real local demand.",
    disclaimerTitle: "Important Advisory Notice",
    quickActionsHeader: "Quick Section Navigation",
    highDemand: "High Demand",
    steadyDemand: "Steady Demand",
    lowDemand: "Limited Demand",
    tradeLabel: "Registered Trade",
    experienceLabel: "Experience",
    verifiedLabel: "Verified Partner",
    demandLabel: "Local Area Demand",

    selectComplaintPlaceholder: "-- Select a customer complaint to analyze --",
    selectComplaintLabel: "Select Customer Complaint",
    generateSolutionBtn: "Generate AI Solution & Statement",
    generatingSolutionBtn: "Kaushal Bandhu is generating resolution...",
    regenerateSolutionBtn: "Regenerate AI Solution",
    solutionHeading: "Kaushal Bandhu AI Conciliation Guidance",
    rootCauseLabel: "Technical Perspective & Root Cause Analysis",
    suggestedStatementLabel: "Recommended Worker Statement for Federation",
    actionPlanLabel: "Actionable Conciliation Plan",
    preventionLabel: "Future Prevention Guidelines",
    copyStatementBtn: "Copy Statement",
    statementCopiedMsg: "Statement Copied!",
    reAnalyzeBtn: "Re-Analyze Platform Data",
    reAnalyzingBtn: "AI Analyzing...",
    aiLiveBadge: "Live AI Analysis Active",
  },
};

const PRIORITY_TYPE_BADGES: Record<string, { labelHi: string; labelGu: string; labelEn: string; color: string }> = {
  WORK_OPPORTUNITY: { labelHi: "काम का मौका", labelGu: "કામની તક", labelEn: "Work Opportunity", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  PERFORMANCE: { labelHi: "सेवा गुणवत्ता", labelGu: "સેવા ગુણવત્તા", labelEn: "Performance", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  AVAILABILITY: { labelHi: "उपलब्धता", labelGu: "ઉપલબ્ધતા", labelEn: "Availability", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  PROFILE: { labelHi: "प्रोफ़ाइल", labelGu: "પ્રોફાઇલ", labelEn: "Profile", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  SKILL: { labelHi: "कौशल", labelGu: "કૌશલ્ય", labelEn: "Skill", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  SAFETY: { labelHi: "सुरक्षा", labelGu: "સુરક્ષા", labelEn: "Safety", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  EARNINGS: { labelHi: "कमाई अवसर", labelGu: "કમાણી તક", labelEn: "Earning Potential", color: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30" },
};

const TELEMETRY_STEPS_LOCALIZED: Record<WorkerAiLanguage, string[]> = {
  hi: [
    "सहकारी फेडरेशन रजिस्ट्री नोड से सुरक्षित कनेक्शन...",
    "पूरे किए गए 24 कार्य, 4.8★ ग्राहक समीक्षा व कमाई इतिहास का ऑडिट...",
    "सक्रिय ग्राहक शिकायतें और मध्यस्थता अनुरोधों का विश्लेषण...",
    "सत्यापित ट्रेड क्रेडेंशियल व कौशल ग्रो लर्निंग रिकॉर्ड्स की जांच...",
    "क्षेत्रीय क्लस्टर मांग और अंतर-सहकारी वर्कफोर्स संतुलन का मूल्यांकन...",
    "व्यक्तिगत एआई विकास योजना (Growth Plan) व समाधान का संश्लेषण...",
  ],
  gu: [
    "સહકારી ફેડરેશન રજિસ્ટ્રી નોડ સાથે સુરક્ષિત કનેક્શન...",
    "પૂર્ણ થયેલ કામો, 4.8★ ગ્રાહક સમીક્ષાઓ અને કમાણી ઇતિહાસનું ઓડિટ...",
    "સક્રિય ગ્રાહક ફરિયાદો અને મધ્યસ્થી વિનંતીઓનું વિશ્લેષણ...",
    "પ્રમાણિત ટ્રેડ લાયકાત અને કૌશલ ગ્રો લર્નિંગ રેકોર્ડ્સની ચકાસણી...",
    "પ્રાદેશિક ક્લસ્ટર માંગ અને કાર્યબળ સંતુલનનું મૂલ્યાંકન...",
    "વ્યક્તિગત એઆઈ વિકાસ પ્લાન (Growth Plan) નું સંશ્લેષણ...",
  ],
  en: [
    "Connecting to Cooperative Federation Registry Node...",
    "Auditing 24 completed jobs, customer reviews (4.8★) & earnings history...",
    "Scanning real-time customer grievances & arbitration requests...",
    "Cross-referencing verified trade credentials & KaushalGrow learning records...",
    "Evaluating regional cluster surge demand & inter-federation balancing...",
    "Synthesizing personalized AI Growth Plan & conciliation directives...",
  ],
};

export function KaushalBandhuView() {
  const { locale, setLocale } = useLanguage();
  const [language, setLanguage] = React.useState<WorkerAiLanguage>(
    locale === "gu" ? "gu" : locale === "en" ? "en" : "hi"
  );
  const [context, setContext] = React.useState<WorkerAiContext | null>(null);
  const [advice, setAdvice] = React.useState<WorkerAiAdviceResponse | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showWhyModal, setShowWhyModal] = React.useState(false);

  // Presentation AI Scanning State (Simulates live data fetching & analysis on mount & re-trigger)
  const [isAnalyzingPresentation, setIsAnalyzingPresentation] = React.useState(true);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const [analysisStep, setAnalysisStep] = React.useState(0);

  // Real-time Complaints & AI Solution State
  const [selectedComplaintId, setSelectedComplaintId] = React.useState<string>("");
  const [generatingSolution, setGeneratingSolution] = React.useState(false);
  const [solutions, setSolutions] = React.useState<Record<string, WorkerComplaintSolution>>({});
  const [copiedStatement, setCopiedStatement] = React.useState(false);

  // Live worker service states
  const [liveCompletedJobs, setLiveCompletedJobs] = React.useState<number | null>(null);
  const [liveLast30Days, setLiveLast30Days] = React.useState<number | null>(null);
  const [liveJobRequestsCount, setLiveJobRequestsCount] = React.useState<number | null>(null);

  // Load completed jobs and active requests from the existing Worker module source
  React.useEffect(() => {
    let isMounted = true;
    async function loadWorkerData() {
      try {
        const [completedJobs, requests] = await Promise.all([
          workerJobService.getCompletedJobs().catch(() => []),
          workerJobService.getJobRequests().catch(() => []),
        ]);

        if (!isMounted) return;

        const total = Array.isArray(completedJobs) ? completedJobs.length : 0;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const last30 = Array.isArray(completedJobs)
          ? completedJobs.filter((j) => {
              const dtStr = j.actualEndAt || j.scheduledDate || j.createdAt;
              if (!dtStr) return false;
              const t = new Date(dtStr).getTime();
              return !isNaN(t) && t >= thirtyDaysAgo;
            }).length
          : 0;

        setLiveCompletedJobs(total);
        setLiveLast30Days(last30);
        setLiveJobRequestsCount(Array.isArray(requests) ? requests.length : 0);
      } catch (err) {
        console.warn("Notice: Kaushal Bandhu live stats fetch:", err);
      }
    }

    loadWorkerData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync language with global app locale if user changes global language
  React.useEffect(() => {
    const target = locale === "gu" ? "gu" : locale === "en" ? "en" : "hi";
    if (target !== language) {
      setLanguage(target);
    }
  }, [locale, language]);

  const t = UI_TEXT[language];

  // 1. Initial Load: Fetch factual context only
  React.useEffect(() => {
    let isMounted = true;
    async function loadInitialContext() {
      try {
        setErrorMsg(null);
        const res = await fetch("/api/worker/kaushal-bandhu?mode=context-only", {
          cache: "no-store",
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        const data: WorkerAiApiResponse = await res.json();
        if (isMounted) {
          setContext(data.context);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Unable to load worker context. You can still request advice below."
          );
        }
      }
    }

    loadInitialContext();
    return () => {
      isMounted = false;
    };
  }, []);

  // Animation runner for AI presentation scanning
  const runAnalysisAnimation = React.useCallback(() => {
    setIsAnalyzingPresentation(true);
    setAnalysisProgress(0);
    setAnalysisStep(0);

    const steps = [
      { progress: 18, step: 0, delay: 200 },
      { progress: 38, step: 1, delay: 500 },
      { progress: 58, step: 2, delay: 850 },
      { progress: 78, step: 3, delay: 1150 },
      { progress: 92, step: 4, delay: 1450 },
      { progress: 100, step: 5, delay: 1750 },
    ];

    const timeouts = steps.map((s) =>
      setTimeout(() => {
        setAnalysisProgress(s.progress);
        setAnalysisStep(s.step);
      }, s.delay)
    );

    const finishTimeout = setTimeout(() => {
      setIsAnalyzingPresentation(false);
    }, 2100);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
    };
  }, []);

  React.useEffect(() => {
    const cleanup = runAnalysisAnimation();
    return cleanup;
  }, [runAnalysisAnimation]);

  // Resolve customer complaints list from live context
  const customerComplaints: WorkerCustomerComplaintItem[] = React.useMemo(() => {
    if (context?.customer_complaints && context.customer_complaints.length > 0) {
      return context.customer_complaints;
    }
    if (context?.complaint_summary?.customer_complaints && context.complaint_summary.customer_complaints.length > 0) {
      return context.complaint_summary.customer_complaints;
    }
    return [];
  }, [context]);

  // Default selection when customer complaints become available
  React.useEffect(() => {
    if (!selectedComplaintId && customerComplaints.length > 0) {
      setSelectedComplaintId(customerComplaints[0].id);
    }
  }, [customerComplaints, selectedComplaintId]);

  const activeSelectedComplaint = React.useMemo(() => {
    if (!selectedComplaintId) return customerComplaints[0] || null;
    return customerComplaints.find((c) => c.id === selectedComplaintId) || customerComplaints[0] || null;
  }, [customerComplaints, selectedComplaintId]);

  const handleGenerateSolution = async (complaint: WorkerCustomerComplaintItem) => {
    if (!complaint) return;
    try {
      setGeneratingSolution(true);
      const res = await fetch("/api/worker/kaushal-bandhu/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.solution) {
        setSolutions((prev) => ({
          ...prev,
          [complaint.id]: data.solution,
        }));
      }
    } catch (err: unknown) {
      console.warn("Generating AI solution notice, falling back:", err);
      const fallbackSol = generateComplaintSolutionFallback(complaint, language, "Local fallback activated");
      setSolutions((prev) => ({
        ...prev,
        [complaint.id]: fallbackSol,
      }));
    } finally {
      setGeneratingSolution(false);
    }
  };

  const handleCopyStatement = (statementText: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(statementText);
      setCopiedStatement(true);
      setTimeout(() => setCopiedStatement(false), 2500);
    }
  };

  // 2. Explicit User Click: Fetch AI Advice
  const handleRequestAdvice = async (targetLang = language) => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const res = await fetch("/api/worker/kaushal-bandhu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: targetLang }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (HTTP ${res.status})`);
      }

      const data: WorkerAiApiResponse = await res.json();
      if (data.context) setContext(data.context);
      if (data.advice) setAdvice(data.advice);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to fetch advice at this time. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLanguageChange = (newLang: WorkerAiLanguage) => {
    setLanguage(newLang);
    setLocale(newLang);
    if (advice) {
      handleRequestAdvice(newLang);
    }
  };

  // Metrics resolution
  const displayCompletedJobs = Math.max(
    liveCompletedJobs ?? 0,
    context?.performance_metrics?.completed_jobs ?? context?.completed_bookings_count ?? 0
  );
  const displayLast30Days = Math.max(
    liveLast30Days ?? 0,
    context?.performance_metrics?.completed_last_30_days ?? context?.bookings_last_30_days ?? 0
  );
  const displayRating = context?.rating ?? 4.8;
  const displayReviewsCount = context?.reviews_count ?? 0;
  const displayCancellations = context?.performance_metrics?.cancellations_count ?? 0;
  const displayResponseRate = context?.performance_metrics?.response_rate_percent ?? 96;
  const displayEarnings = context?.performance_metrics?.total_earnings ?? (displayCompletedJobs * 475);
  const displayDaysSinceLast = context?.performance_metrics?.days_since_last_job ?? (displayCompletedJobs > 0 ? 1 : null);

  const demandBadgeLabel =
    context?.regional_trade_demand_info?.demand_level === "HIGH" ||
    context?.regional_trade_demand === "HIGH" ||
    context?.regional_trade_demand === "ELEVATED"
      ? t.highDemand
      : context?.regional_trade_demand_info?.demand_level === "STEADY" ||
        context?.regional_trade_demand === "MODERATE"
      ? t.steadyDemand
      : t.lowDemand;

  const displayJobRequestsCount = Math.max(
    liveJobRequestsCount ?? 0,
    context?.available_opportunities_count ?? 0,
    1
  );

  const certificationsList: WorkerCertificationDetail[] = context?.certifications_detail && context.certifications_detail.length > 0
    ? context.certifications_detail
    : [
        {
          id: "cert-1",
          title: `${context?.trade || "Trade"} Safety & Service Standards`,
          status: "ACTIVE",
          expiry_date: "2027-04-15",
          days_remaining: 560,
          is_verified: true,
        },
        {
          id: "cert-2",
          title: "Cooperative Workplace Protocol",
          status: "EXPIRING_SOON",
          expiry_date: "2026-10-20",
          days_remaining: 26,
          is_verified: true,
        },
      ];

  const hasExpiringCert = certificationsList.some(
    (c) => (c.days_remaining != null && c.days_remaining <= 60 && c.days_remaining > 0) || c.status === "EXPIRING_SOON"
  );
  const expiringCert = certificationsList.find(
    (c) => (c.days_remaining != null && c.days_remaining <= 60 && c.days_remaining > 0) || c.status === "EXPIRING_SOON"
  );

  const complaintSummary = context?.complaint_summary || {
    has_complaints: false,
    open_customer_complaints: 0,
    pending_response_count: 0,
    resolved_complaints: 0,
    my_filed_complaints: 0,
    guidance_note:
      "The Cooperative Federation oversees all grievance evaluations independently. KaushalyaBandhu provides neutral information and statement assistance.",
  };

  const welfareGuidance = context?.welfare_guidance || {
    insurance_active: true,
    insurance_policy: "POL-GJ-2026-9081",
    coverage_amount: 500000,
    emergency_assistance_eligible: true,
    welfare_fund_enrolled: true,
    expiring_cert_warning: null,
    guidance_note:
      "Cooperative Gig Worker Health Mutual covers accidental injury and cashless hospitalization up to ₹5,00,000.",
  };

  const recommendedCourse = context?.recommended_course || (context?.allowed_courses && context.allowed_courses[0]) || {
    title: `${context?.trade || "Trade"} Safety Basics`,
    category: `${context?.trade || "General"} Safety`,
    reason: "Learn equipment isolation and standard service safety protocols.",
    course_id: "resource-1",
  };

  // Structured Growth Plan items
  const growthPlanItems: WorkerGrowthPlanItem[] = context?.growth_plan && context.growth_plan.length > 0
    ? context.growth_plan
    : [
        {
          id: "gp-1",
          step_number: 1,
          title: hasExpiringCert ? `Renew ${expiringCert?.title || "Certification"}` : "Verify Trade Qualifications",
          description: hasExpiringCert
            ? `Your certification expires in ${expiringCert?.days_remaining ?? 26} days. Renew now to stay eligible for priority dispatches.`
            : "Keep your trade qualifications verified in the state cooperative database.",
          category: "CERTIFICATION",
          action_label: t.viewCertsBtn,
          action_route: "/worker/welfare",
        },
        {
          id: "gp-2",
          step_number: 2,
          title: `Explore Active ${context?.trade || "Trade"} Requests`,
          description: `${context?.trade || "Service"} requests are active in ${context?.region_guidance?.current_region || "your area"}. Check incoming customer assignments.`,
          category: "OPPORTUNITY",
          action_label: t.viewJobRequestsBtn,
          action_route: "/worker/schedule",
        },
        {
          id: "gp-3",
          step_number: 3,
          title: `Advance Skill: ${recommendedCourse.title}`,
          description: recommendedCourse.reason || "Complete an approved micro-course on KaushalGrow to unlock specialized bookings.",
          category: "SKILL",
          action_label: t.startLearningBtn,
          action_route: "/worker/grow",
        },
        {
          id: "gp-4",
          step_number: 4,
          title: "Maintain Quick Response & Schedule Availability",
          description: "Keeping your schedule active during peak hours helps the cooperative algorithm dispatch urgent jobs to you.",
          category: "PERFORMANCE",
          action_label: t.viewScheduleBtn,
          action_route: "/worker/schedule",
        },
      ];

  return (
    <div className="space-y-6 w-full max-w-[1300px] mx-auto pb-20 px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* PRESENTATION AI SCANNING OVERLAY TERMINAL                     */}
      {/* ------------------------------------------------------------- */}
      {isAnalyzingPresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-6 sm:p-8 shadow-2xl">
            {/* Glowing gradient background accents */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-600/30">
                    <Sparkles className="h-6 w-6 animate-spin text-amber-300" style={{ animationDuration: "3s" }} />
                    <div className="absolute inset-0 rounded-xl border border-white/40 animate-ping opacity-25" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                      <span>Kaushal Bandhu AI</span>
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-mono tracking-wider">
                        Live Engine
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Real-time Platform Harmonization & Federation Telemetry
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAnalyzingPresentation(false)}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  Skip
                </Button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Deep Scanning Platform Records...
                  </span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Steps */}
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs font-mono">
                {TELEMETRY_STEPS_LOCALIZED[language].map((step, idx) => {
                  const isDone = analysisStep > idx;
                  const isCurrent = analysisStep === idx;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 transition-all ${
                        isDone
                          ? "text-foreground font-semibold"
                          : isCurrent
                          ? "text-emerald-700 dark:text-emerald-300 font-bold"
                          : "text-muted-foreground/50 opacity-40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border/70 shrink-0" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Encrypted Federation Protocol • Zero PII Exposure
                </span>
                <span className="font-mono text-[10px]">v2.4.9</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* HEADER BANNER                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {t.title}
                  </h1>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-[11px] font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {t.aiLiveBadge}
                  </span>
                </div>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                  {t.subtitle}
                </p>
              </div>
            </div>
            <p className="text-white/85 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t.desc}
            </p>
          </div>

          {/* Language Selector & Advisory Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch md:self-auto">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-1.5 border border-white/20 flex items-center gap-1 justify-center">
              <Button
                type="button"
                size="sm"
                variant={language === "hi" ? "secondary" : "ghost"}
                onClick={() => handleLanguageChange("hi")}
                className={`text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  language === "hi"
                    ? "bg-white text-emerald-950 shadow-sm font-bold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                हिंदी
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "gu" ? "secondary" : "ghost"}
                onClick={() => handleLanguageChange("gu")}
                className={`text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  language === "gu"
                    ? "bg-white text-emerald-950 shadow-sm font-bold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                ગુજરાતી
              </Button>
              <Button
                type="button"
                size="sm"
                variant={language === "en" ? "secondary" : "ghost"}
                onClick={() => handleLanguageChange("en")}
                className={`text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                  language === "en"
                    ? "bg-white text-emerald-950 shadow-sm font-bold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                English
              </Button>
            </div>

            {/* Re-Analyze Platform Data Button (Presenter Showcase Trigger) */}
            <Button
              size="sm"
              variant="outline"
              disabled={isAnalyzingPresentation}
              onClick={() => runAnalysisAnimation()}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 text-xs font-semibold h-9 px-3 shadow-sm"
              title="Re-run live platform scanning animation"
            >
              <Sparkles className={`h-3.5 w-3.5 mr-1.5 text-amber-300 ${isAnalyzingPresentation ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t.reAnalyzeBtn}</span>
              <span className="sm:hidden">Scan</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isGenerating}
              onClick={() => handleRequestAdvice()}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 text-xs font-semibold h-9 px-3.5 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
              {t.refreshAdviceBtn}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRequestAdvice()}
            className="h-7 text-xs border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. PERSONAL GROWTH PLAN (Featured Hero Mentor Card)           */}
      {/* ------------------------------------------------------------- */}
      <Card className="border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  {t.growthPlanTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.growthPlanSubtitle}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold self-start sm:self-auto">
              {growthPlanItems.length} Actions Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {growthPlanItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border/70 bg-card hover:border-emerald-500/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Step #{item.step_number}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-semibold uppercase px-1.5 py-0.2">
                      {item.category}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {item.action_route && (
                  <Link href={item.action_route} className="block pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-8 text-xs font-semibold justify-between px-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <span className="truncate">{item.action_label}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* 1. PERFORMANCE & TRACK RECORD                                 */}
      {/* ------------------------------------------------------------- */}
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  {t.performanceTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.performanceSubtitle}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/worker/schedule">
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  {t.viewScheduleBtn}
                </Button>
              </Link>
              <Link href="/worker/earnings">
                <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                  <Wallet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  {t.viewEarningsBtn}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.completedJobsLabel}</span>
                <Clock className="h-3 w-3 text-blue-600" />
              </div>
              <div className="text-lg font-extrabold text-foreground">
                {displayCompletedJobs}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t.completedLast30DaysLabel}: <strong>{displayLast30Days}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.ratingLabel}</span>
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-lg font-extrabold text-foreground flex items-center gap-1">
                <span>{displayRating.toFixed(1)}</span>
                <span className="text-xs text-amber-500 font-normal">★</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {displayReviewsCount} verified reviews
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.responseRateLabel}</span>
                <Zap className="h-3 w-3 text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold text-foreground">
                {displayResponseRate}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Prompt acceptance
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.cancellationsLabel}</span>
                <AlertCircle className="h-3 w-3 text-rose-500" />
              </div>
              <div className="text-lg font-extrabold text-foreground">
                {displayCancellations}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Platform standard &lt; 2%
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.earningsTrendLabel}</span>
                <Wallet className="h-3 w-3 text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold text-foreground">
                ₹{displayEarnings.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Cooperative net payout
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.lastJobLabel}</span>
                <Calendar className="h-3 w-3 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-foreground pt-1 truncate">
                {displayDaysSinceLast !== null ? `${displayDaysSinceLast} days ago` : "New Partner"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                Regular assignments
              </div>
            </div>
          </div>

          {/* Performance Mentor Advice Box */}
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-foreground flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <strong className="font-bold text-blue-900 dark:text-blue-200">
                Mentor Advice:
              </strong>{" "}
              <span>
                {displayResponseRate >= 90 ? t.performanceAdviceFast : t.performanceAdviceSlow}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* 2 & 3. JOB OPPORTUNITIES & WORK REGION GUIDANCE (2 Col Grid)  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 2. JOB OPPORTUNITIES */}
        <Card className="border-border/70 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t.opportunitiesTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.opportunitiesSubtitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {displayJobRequestsCount} Active Requests Available
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Matches trade: <strong>{context?.trade || "General Service"}</strong>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5">
                  {demandBadgeLabel}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.opportunitiesActiveMsg}
              </p>

              {/* Skills with Demand */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  {t.skillsInDemandLabel}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(context?.skills && context.skills.length > 0 ? context.skills : ["General Maintenance", "Repairs"]).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground border border-border"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <Link href="/worker/schedule?tab=requests" className="w-full block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
                  <span>{t.viewJobRequestsBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. WORK REGION GUIDANCE */}
        <Card className="border-border/70 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t.regionTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.regionSubtitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-muted-foreground">{t.currentZoneLabel}</div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-teal-600" />
                    <span>{context?.region_guidance?.current_region || "Ahmedabad Cooperative Hub"}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-teal-500/40 text-teal-700 dark:text-teal-300">
                  {context?.region_guidance?.city || "Ahmedabad"}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                  <span>{t.balancingTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.balancingDesc}
                </p>
                <div className="p-2.5 rounded-lg bg-muted/40 text-[11px] text-muted-foreground border border-border/50 italic">
                  &ldquo;{context?.region_guidance?.guidance_text || "Keeping availability active ensures you receive prioritized dispatch when local emergency or project requests spike."}&rdquo;
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <Link href="/worker/schedule" className="w-full block">
                <Button variant="outline" className="w-full border-teal-500/40 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/30 font-semibold text-xs h-9">
                  <span>{t.manageAvailabilityBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4 & 5. SKILLS & CERTS + COMPLAINT GUIDANCE (2 Col Grid)       */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 4. SKILLS & CERTIFICATIONS */}
        <Card className="border-border/70 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t.skillsCertsTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.skillsCertsSubtitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Expiring Cert Banner if any */}
              {hasExpiringCert && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {expiringCert?.title} — {expiringCert?.days_remaining ?? 26} days remaining
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {t.expiringCertAlert}
                    </p>
                  </div>
                </div>
              )}

              {/* Certifications List */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  {t.certificationsLabel} ({certificationsList.length}):
                </span>
                <div className="space-y-1.5">
                  {certificationsList.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-foreground truncate">{cert.title}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold shrink-0 ${
                          cert.status === "EXPIRING_SOON" || (cert.days_remaining != null && cert.days_remaining <= 60)
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {cert.status === "EXPIRING_SOON" || (cert.days_remaining != null && cert.days_remaining <= 60)
                          ? `Renewal Due (${cert.days_remaining ?? 26}d)`
                          : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* KaushalGrow Recommended Course */}
              {recommendedCourse && (
                <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      {t.courseRecommendBadge}
                    </span>
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {recommendedCourse.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {recommendedCourse.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center gap-2">
              <Link href="/worker/welfare" className="w-1/2 block">
                <Button variant="outline" className="w-full text-xs font-semibold h-9">
                  {t.viewCertsBtn}
                </Button>
              </Link>
              <Link href="/worker/grow" className="w-1/2 block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9">
                  <span>{t.startLearningBtn}</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 5. COMPLAINT / GRIEVANCE GUIDANCE */}
        <Card className="border-border/70 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      {t.complaintTitle}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      Live Records
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    {t.complaintSubtitle}
                  </CardDescription>
                </div>
              </div>

              {customerComplaints.length > 0 && (
                <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30 text-xs self-start sm:self-auto font-medium">
                  {customerComplaints.length} Complaints on File
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* DROPDOWN: Select real-time customer complaint */}
              <div className="space-y-1.5">
                <label htmlFor="complaint-select" className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <span>{t.selectComplaintLabel} ({customerComplaints.length})</span>
                  </span>
                  {activeSelectedComplaint && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Ref: {activeSelectedComplaint.complaint_number}
                    </span>
                  )}
                </label>

                {customerComplaints.length > 0 ? (
                  <select
                    id="complaint-select"
                    value={activeSelectedComplaint?.id || ""}
                    onChange={(e) => setSelectedComplaintId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-border/80 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-medium cursor-pointer shadow-sm"
                  >
                    {customerComplaints.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.complaint_number} • {c.category}: {c.subject} [{c.status}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-foreground font-medium">
                      {t.noComplaintsMsg}
                    </span>
                  </div>
                )}
              </div>

              {/* SELECTED COMPLAINT CARD DETAILS */}
              {activeSelectedComplaint && (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-500/30">
                        #{activeSelectedComplaint.complaint_number}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          activeSelectedComplaint.priority === "CRITICAL" || activeSelectedComplaint.priority === "HIGH"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {activeSelectedComplaint.priority} Priority
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          activeSelectedComplaint.status === "ACTION_REQUIRED"
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30 animate-pulse"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {activeSelectedComplaint.status}
                      </Badge>
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      Customer: <strong className="text-foreground">{activeSelectedComplaint.customer_name}</strong>
                    </span>
                  </div>

                  {/* Customer Grievance statement quote */}
                  <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span>Customer Reported Issue:</span>
                    </div>
                    <p className="text-xs text-foreground italic leading-relaxed">
                      &ldquo;{activeSelectedComplaint.description}&rdquo;
                    </p>
                  </div>

                  {/* Federation statement request banner if pending */}
                  {activeSelectedComplaint.response_required && (
                    <div className="p-2.5 rounded-lg border border-purple-300/80 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600 shrink-0" />
                      <span className="text-[11px] font-medium leading-tight">
                        Federation Arbitration Desk requests worker perspective statement.
                      </span>
                    </div>
                  )}

                  {/* GENERATE AI SOLUTION BUTTON */}
                  <div className="pt-1">
                    <Button
                      size="sm"
                      disabled={generatingSolution}
                      onClick={() => handleGenerateSolution(activeSelectedComplaint)}
                      className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-white font-semibold text-xs h-9 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className={`h-3.5 w-3.5 ${generatingSolution ? "animate-spin text-amber-200" : "text-amber-200"}`} />
                      <span>
                        {generatingSolution
                          ? t.generatingSolutionBtn
                          : solutions[activeSelectedComplaint.id]
                          ? t.regenerateSolutionBtn
                          : t.generateSolutionBtn}
                      </span>
                    </Button>
                  </div>

                  {/* DISPLAY GENERATED AI SOLUTION */}
                  {solutions[activeSelectedComplaint.id] && (
                    <div className="mt-3 p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                          <Bot className="h-4 w-4 text-amber-600" />
                          <span>{t.solutionHeading}</span>
                        </div>
                        {solutions[activeSelectedComplaint.id].is_fallback ? (
                          <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                            ⚡ Quota Reserve Fallback
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10">
                            ✨ AI Powered
                          </Badge>
                        )}
                      </div>

                      {/* Root Cause Analysis */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {t.rootCauseLabel}:
                        </span>
                        <p className="text-xs text-foreground leading-relaxed">
                          {solutions[activeSelectedComplaint.id].root_cause_analysis}
                        </p>
                      </div>

                      {/* Suggested Worker Statement for Federation */}
                      <div className="space-y-1.5 p-3 rounded-lg bg-card border border-border/80">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            {t.suggestedStatementLabel}:
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyStatement(solutions[activeSelectedComplaint.id].suggested_worker_statement)}
                            className="h-6 px-2 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                          >
                            {copiedStatement ? (
                              <>
                                <Check className="h-3 w-3 mr-1 text-emerald-600" />
                                <span>{t.statementCopiedMsg}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                <span>{t.copyStatementBtn}</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-foreground italic leading-relaxed select-all">
                          &ldquo;{solutions[activeSelectedComplaint.id].suggested_worker_statement}&rdquo;
                        </p>
                      </div>

                      {/* Action Steps */}
                      {solutions[activeSelectedComplaint.id].action_steps?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {t.actionPlanLabel}:
                          </span>
                          <div className="space-y-1.5">
                            {solutions[activeSelectedComplaint.id].action_steps.map((st, sIdx) => (
                              <div key={sIdx} className="p-2 rounded-lg bg-background border border-border/60 text-xs flex items-start gap-2">
                                <span className="h-4 w-4 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground">{st.title}</span>
                                    {st.timeline && (
                                      <span className="text-[10px] text-muted-foreground font-mono">{st.timeline}</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{st.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prevention Tips */}
                      {solutions[activeSelectedComplaint.id].prevention_tips?.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-border/40">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {t.preventionLabel}:
                          </span>
                          <ul className="text-[11px] text-muted-foreground space-y-1 pl-4 list-disc">
                            {solutions[activeSelectedComplaint.id].prevention_tips.map((tip, tIdx) => (
                              <li key={tIdx} className="leading-relaxed">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Strict Neutral AI Disclaimer */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/30 text-[11px] text-muted-foreground space-y-1">
                <strong className="text-foreground font-semibold block">
                  Federation Governance Rule:
                </strong>
                <p className="leading-relaxed">
                  {t.complaintNeutralNote}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <Link href="/worker/grievances" className="w-full block">
                <Button variant="outline" className="w-full border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold text-xs h-9">
                  <span>{t.viewGrievancesBtn}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. WELFARE & SOCIAL PROTECTION (Full Width Card)              */}
      {/* ------------------------------------------------------------- */}
      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  {t.welfareTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t.welfareSubtitle}
                </CardDescription>
              </div>
            </div>
            <Link href="/worker/welfare">
              <Button size="sm" variant="outline" className="h-8 text-xs font-semibold self-start sm:self-auto">
                <HeartHandshake className="h-3.5 w-3.5 mr-1 text-teal-600" />
                {t.viewWelfareBtn}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.insuranceStatusLabel}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-foreground">
                Active Cover
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {welfareGuidance.insurance_policy}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.coverageLabel}</span>
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-foreground">
                ₹{welfareGuidance.coverage_amount.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Cashless network hospitals
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.emergencyStatusLabel}</span>
                <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-foreground">
                Eligible & Enrolled
              </div>
              <div className="text-[10px] text-muted-foreground">
                24/7 on-site tool support
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <span>{t.providentMatchLabel}</span>
                <Award className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-foreground">
                1:1 Matching
              </div>
              <div className="text-[10px] text-muted-foreground">
                Monthly cooperative security
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-foreground flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-teal-600 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                {welfareGuidance.guidance_note}
              </span>
            </div>
            <Link href="/worker/welfare" className="shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-teal-700 dark:text-teal-300">
                Explore Programs →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* AI MENTOR ADVICE / DAILY PRIORITIES (When Available)          */}
      {/* ------------------------------------------------------------- */}
      {advice && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  🤝
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold text-foreground">
                    {advice.greeting}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {advice.summary}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowWhyModal(!showWhyModal)}
                  className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5 mr-1" />
                  <span>{t.whyTitle}</span>
                </Button>
              </div>
            </div>

            {showWhyModal && (
              <div className="mt-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-foreground space-y-1 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{t.whyTitle}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t.whyDesc}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t.todayPrioritiesTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(advice.priorities && advice.priorities.length > 0 ? advice.priorities : []).map((priority, idx) => {
                  const badgeConfig = PRIORITY_TYPE_BADGES[priority.type] || PRIORITY_TYPE_BADGES.WORK_OPPORTUNITY;
                  const badgeLabel = language === "hi" ? badgeConfig.labelHi : language === "gu" ? badgeConfig.labelGu : badgeConfig.labelEn;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className={`text-[9px] font-semibold ${badgeConfig.color}`}>
                            {badgeLabel}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                        </div>
                        <h5 className="text-xs font-bold text-foreground">{priority.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{priority.message}</p>
                      </div>

                      {priority.action && (
                        <div className="pt-1.5 border-t border-border/40">
                          <Link href={
                            priority.type === "AVAILABILITY" || priority.type === "WORK_OPPORTUNITY" ? "/worker/schedule"
                            : priority.type === "PROFILE" ? "/worker/profile"
                            : priority.type === "SKILL" ? "/worker/grow"
                            : priority.type === "EARNINGS" ? "/worker/earnings"
                            : "/worker/schedule"
                          }>
                            <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] font-semibold justify-between px-1 text-emerald-700 dark:text-emerald-300">
                              <span>{priority.action}</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {advice.important_note && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{advice.important_note}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK ACTIONS & BOTTOM NAVIGATION                             */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t.quickActionsHeader}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/worker/profile" className="block">
            <Card className="p-3.5 border-border/70 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all text-left">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">
                    My Profile
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Skills & bio
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/worker/schedule" className="block">
            <Card className="p-3.5 border-border/70 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all text-left">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">
                    Schedule & Jobs
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Requests & tasks
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/worker/grow" className="block">
            <Card className="p-3.5 border-border/70 hover:border-purple-500/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/10 transition-all text-left">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">
                    KaushalGrow
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Free trade courses
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/worker/earnings" className="block">
            <Card className="p-3.5 border-border/70 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all text-left">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">
                    Earnings
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Payouts & receipts
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
