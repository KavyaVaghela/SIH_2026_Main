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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type {
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
  WorkerAiApiResponse,
} from "@/lib/ai/ai-types";

import { useLanguage } from "@/lib/i18n/language-context";

const UI_TEXT = {
  hi: {
    title: "कौशल बंधु",
    subtitle: "कार्य, गुणवत्ता और कौशल विकास साथी",
    greetingDefault: "नमस्ते साथी, कौशल बंधु में आपका स्वागत है!",
    desc: "यहाँ आप अपने काम के अवसर, सेवा गुणवत्ता और कौशल विकास के लिए व्यावहारिक और वास्तविक मार्गदर्शन प्राप्त कर सकते हैं।",
    getAdviceBtn: "मार्गदर्शन प्राप्त करें",
    refreshAdviceBtn: "नया मार्गदर्शन प्राप्त करें",
    loadingText: "कौशल बंधु आपके लिए मार्गदर्शन तैयार कर रहे हैं...",
    tradeLabel: "पंजीकृत कार्य",
    experienceLabel: "अनुभव",
    verifiedLabel: "सत्यापित साथी",
    jobsDoneLabel: "पूरे किए गए काम",
    demandLabel: "इलाके में काम की मांग",
    skillsLabel: "आपके कौशल",
    tipsHeader: "आज की जरूरी बातें",
    learningHeader: "कौशल विकास (KaushalGrow)",
    openCourseBtn: "कोर्स सीखें",
    quickActionsHeader: "त्वरित सेटिंग्स",
    disclaimerTitle: "ज़रूरी सूचना",
    highDemand: "उच्च मांग",
    steadyDemand: "सामान्य मांग",
    lowDemand: "सीमित मांग",
    whyTitle: "यह सलाह आपको क्यों दिखाई दे रही है?",
    whyDesc: "यह मार्गदर्शन आपके वास्तविक काम, रेटिंग, हाल के ऑर्डर्स और आपके इलाके की मांग पर आधारित है।",
    noCourseMsg: "अभी आपके काम से जुड़ा कोई नया कोर्स उपलब्ध नहीं है।",
    actionCheckAvailability: "उपलब्धता जांचें",
    actionViewProfile: "प्रोफ़ाइल देखें",
    actionSchedule: "शेड्यूल देखें",
  },
  gu: {
    title: "કૌશલ બંધુ",
    subtitle: "કાર્ય, ગુણવત્તા અને કૌશલ્ય વિકાસ સાથી",
    greetingDefault: "નમસ્તે સાથી, કૌશલ બંધુમાં તમારું સ્વાગત છે!",
    desc: "અહીં તમે તમારા કામની તકો, સેવા ગુણવત્તા અને કૌશલ્ય વિકાસ માટે વ્યવહારુ અને વાસ્તવિક માર્ગદર્શન મેળવી શકો છો.",
    getAdviceBtn: "માર્ગદર્શન મેળવો",
    refreshAdviceBtn: "નવું માર્ગદર્શન મેળવો",
    loadingText: "કૌશલ બંધુ તમારા માટે માર્ગદર્શન તૈયાર કરી રહ્યા છે...",
    tradeLabel: "નોંધાયેલ કાર્ય",
    experienceLabel: "અનુભવ",
    verifiedLabel: "પ્રમાણિત સાથી",
    jobsDoneLabel: "પૂર્ણ કરેલા કામ",
    demandLabel: "વિસ્તારમાં કામની માંગ",
    skillsLabel: "તમારા કૌશલ્યો",
    tipsHeader: "આજની મહત્વપૂર્ણ બાબતો",
    learningHeader: "કૌશલ્ય વિકાસ (KaushalGrow)",
    openCourseBtn: "કોર્સ શીખો",
    quickActionsHeader: "ઝડપી સેટિંગ્સ",
    disclaimerTitle: "મહત્વપૂર્ણ નોંધ",
    highDemand: "ઊંચી માંગ",
    steadyDemand: "સામાન્ય માંગ",
    lowDemand: "મર્યાદિત માંગ",
    whyTitle: "આ સલાહ તમને કેમ દેખાઈ રહી છે?",
    whyDesc: "આ માર્ગદર્શન તમારા વાસ્તવિક કાર્ય, રેટિંગ, તાજેતરના ઓર્ડર અને તમારા વિસ્તારની માંગ પર આધારિત છે.",
    noCourseMsg: "હાલમાં તમારા કામ સાથે જોડાયેલ કોઈ નવો કોર્સ ઉપલબ્ધ નથી.",
    actionCheckAvailability: "ઉપલબ્ધતા ચકાસો",
    actionViewProfile: "પ્રોફાઇલ જુઓ",
    actionSchedule: "શેડ્યૂલ જુઓ",
  },
  en: {
    title: "Kaushal Bandhu",
    subtitle: "Work Care, Performance & Skills Assistant",
    greetingDefault: "Hello Partner, welcome to Kaushal Bandhu!",
    desc: "Get practical, grounded guidance to improve your work opportunities, service quality, and skill development.",
    getAdviceBtn: "Get Advice",
    refreshAdviceBtn: "Refresh Advice",
    loadingText: "Kaushal Bandhu is preparing your advice...",
    tradeLabel: "Registered Trade",
    experienceLabel: "Experience",
    verifiedLabel: "Verified Partner",
    jobsDoneLabel: "Completed Jobs",
    demandLabel: "Local Area Demand",
    skillsLabel: "Your Skills",
    tipsHeader: "Today's Priorities for You",
    learningHeader: "Skill Development (KaushalGrow)",
    openCourseBtn: "Start Learning",
    quickActionsHeader: "Quick Settings",
    disclaimerTitle: "Important Notice",
    highDemand: "High Demand",
    steadyDemand: "Steady Demand",
    lowDemand: "Limited Demand",
    whyTitle: "Why are you seeing this advice?",
    whyDesc: "This guidance is grounded in your real completed jobs, customer rating, availability, and regional trade demand.",
    noCourseMsg: "No new course available for your trade right now.",
    actionCheckAvailability: "Check Availability",
    actionViewProfile: "View Profile",
    actionSchedule: "View Schedule",
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

export function KaushalBandhuView() {
  const { locale, setLocale } = useLanguage();
  const [language, setLanguage] = React.useState<WorkerAiLanguage>(
    locale === "gu" ? "gu" : locale === "en" ? "en" : "hi"
  );
  const [context, setContext] = React.useState<WorkerAiContext | null>(null);
  const [advice, setAdvice] = React.useState<WorkerAiAdviceResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showWhyModal, setShowWhyModal] = React.useState(false);

  // Sync language with global app locale if user changes global language
  React.useEffect(() => {
    const target = locale === "gu" ? "gu" : locale === "en" ? "en" : "hi";
    if (target !== language) {
      setLanguage(target);
    }
  }, [locale]);

  const t = UI_TEXT[language];

  // 1. Initial Load: Fetch factual context only
  React.useEffect(() => {
    let isMounted = true;
    async function loadInitialContext() {
      try {
        setIsLoadingContext(true);
        setErrorMsg(null);
        const res = await fetch("/api/worker/kaushal-bandhu?mode=context-only");
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
      } finally {
        if (isMounted) {
          setIsLoadingContext(false);
        }
      }
    }

    loadInitialContext();
    return () => {
      isMounted = false;
    };
  }, []);

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
    setLocale(newLang); // Persist across the app session
    // If advice is already generated, refresh advice in the newly selected language
    if (advice) {
      handleRequestAdvice(newLang);
    }
  };

  const demandBadgeLabel =
    context?.regional_trade_demand_info?.demand_level === "HIGH" ||
    context?.regional_trade_demand === "HIGH" ||
    context?.regional_trade_demand === "ELEVATED"
      ? t.highDemand
      : context?.regional_trade_demand_info?.demand_level === "STEADY" ||
        context?.regional_trade_demand === "MODERATE"
      ? t.steadyDemand
      : t.lowDemand;

  const learningTitle =
    advice && advice.learning_suggestion
      ? typeof advice.learning_suggestion === "string"
        ? advice.learning_suggestion
        : advice.learning_suggestion.title
      : null;

  const learningReason =
    advice && advice.learning_suggestion && typeof advice.learning_suggestion === "object"
      ? advice.learning_suggestion.reason
      : null;

  return (
    <div className="space-y-6 w-full max-w-[1300px] mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {t.title}
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                  {t.subtitle}
                </p>
              </div>
            </div>
            <p className="text-white/85 text-xs sm:text-sm max-w-xl">
              {t.desc}
            </p>
          </div>

          {/* Language Selector */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-1.5 border border-white/20 flex items-center gap-1 self-stretch sm:self-auto justify-center">
            <Button
              type="button"
              size="sm"
              variant={language === "hi" ? "secondary" : "ghost"}
              onClick={() => handleLanguageChange("hi")}
              className={`text-xs font-semibold px-3 py-1.5 h-8 transition-all ${
                language === "hi"
                  ? "bg-white text-emerald-900 shadow-sm font-bold"
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
                  ? "bg-white text-emerald-900 shadow-sm font-bold"
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
                  ? "bg-white text-emerald-900 shadow-sm font-bold"
                  : "text-white hover:bg-white/10"
              }`}
            >
              English
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Factual Profile Context Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Trade */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow transition-all">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t.tradeLabel}</span>
              <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-base font-bold text-foreground truncate">
              {context?.trade || "Service Professional"}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Award className="h-3 w-3 text-emerald-500" />
              <span>{context?.experience_level || "Experienced"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow transition-all">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Status</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold px-2 py-0.5"
              >
                {t.verifiedLabel}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {context?.availability_status === "AVAILABLE" ? "Active on platform" : "Busy"}
            </div>
          </CardContent>
        </Card>

        {/* Completed Jobs */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow transition-all">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t.jobsDoneLabel}</span>
              <Clock className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-base font-bold text-foreground">
              {context?.completed_bookings_count ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Last 30 days: <strong>{context?.bookings_last_30_days ?? 0}</strong>
            </div>
          </CardContent>
        </Card>

        {/* Local Demand */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow transition-all">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>{t.demandLabel}</span>
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge
                variant="outline"
                className={`text-xs font-semibold px-2 py-0.5 ${
                  context?.regional_trade_demand_info?.demand_level === "HIGH" ||
                  context?.regional_trade_demand === "HIGH" ||
                  context?.regional_trade_demand === "ELEVATED"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : context?.regional_trade_demand_info?.demand_level === "STEADY" ||
                      context?.regional_trade_demand === "MODERATE"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30"
                }`}
              >
                {demandBadgeLabel}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {context?.regional_trade_demand_info?.region || "Local Area"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Kaushal Bandhu Advice Section */}
      {!advice ? (
        /* Empty State / Initial CTA */
        <Card className="border-dashed border-2 border-emerald-300/60 dark:border-emerald-700/50 bg-emerald-50/20 dark:bg-emerald-950/10 p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-foreground">
              {t.greetingDefault}
            </h2>
            <p className="text-xs text-muted-foreground">
              {language === "hi"
                ? "कौशल बंधु आपको काम में सफलता, ग्राहकों के साथ अच्छा तालमेल और नई तकनीकों के बारे में सरल सलाह देते हैं।"
                : language === "gu"
                ? "કૌશલ બંધુ તમને કામમાં સફળતા, ગ્રાહકો સાથે સારા સંબંધ અને નવી તકનીકો વિશે સરળ માર્ગદર્શન આપે છે."
                : "Kaushal Bandhu provides straightforward advice to help you succeed, communicate well with customers, and learn new skills."}
            </p>
          </div>

          <Button
            size="lg"
            disabled={isGenerating || isLoadingContext}
            onClick={() => handleRequestAdvice()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 h-auto shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t.loadingText}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
                {t.getAdviceBtn}
              </>
            )}
          </Button>
        </Card>
      ) : (
        /* Advice Display */
        <div className="space-y-6">
          {/* Greeting & Summary Card */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    🤝
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-extrabold text-foreground">
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

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => handleRequestAdvice()}
                    className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 flex-shrink-0"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`}
                    />
                    {t.refreshAdviceBtn}
                  </Button>
                </div>
              </div>

              {/* Optional "Why am I seeing this?" info box */}
              {showWhyModal && (
                <div className="mt-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-foreground space-y-1 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t.whyTitle}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t.whyDesc}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-card border border-border">
                      {t.tradeLabel}: <strong>{context?.trade || "General"}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-card border border-border">
                      {t.jobsDoneLabel}: <strong>{context?.completed_bookings_count ?? 0}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-card border border-border">
                      Rating: <strong>{context?.rating ? `${context.rating} ★` : "New Worker"}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-card border border-border">
                      Demand: <strong>{demandBadgeLabel}</strong>
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Structured Priorities List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground">
                {t.tipsHeader}
              </h3>
            </div>

            {advice.priorities && advice.priorities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {advice.priorities.map((priority, idx) => {
                  const badgeConfig = PRIORITY_TYPE_BADGES[priority.type] || PRIORITY_TYPE_BADGES.WORK_OPPORTUNITY;
                  const badgeLabel = language === "hi" ? badgeConfig.labelHi : language === "gu" ? badgeConfig.labelGu : badgeConfig.labelEn;

                  return (
                    <Card
                      key={idx}
                      className="border-border/70 bg-card shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                    >
                      <CardContent className="p-4 space-y-2.5 flex flex-col justify-between h-full">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${badgeConfig.color}`}
                            >
                              {badgeLabel}
                            </Badge>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              #{idx + 1}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground">
                            {priority.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {priority.message}
                          </p>
                        </div>

                        {priority.action && (
                          <div className="pt-2 border-t border-border/40">
                            {priority.type === "AVAILABILITY" || priority.type === "WORK_OPPORTUNITY" ? (
                              <Link href="/worker/schedule">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 w-full justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                  <span>{priority.action}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            ) : priority.type === "PROFILE" ? (
                              <Link href="/worker/profile">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-blue-700 dark:text-blue-300 w-full justify-between hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                  <span>{priority.action}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            ) : priority.type === "SKILL" ? (
                              <Link href="/worker/grow">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-purple-700 dark:text-purple-300 w-full justify-between hover:bg-purple-50 dark:hover:bg-purple-950/30">
                                  <span>{priority.action}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            ) : (
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {priority.action}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Fallback tips grid if priorities array is not present */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {advice.tips.map((tip, idx) => (
                  <Card
                    key={idx}
                    className="border-border/70 bg-card shadow-sm hover:border-emerald-500/40 transition-all"
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-foreground font-medium leading-relaxed">
                        {tip}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Learning Recommendation (KaushalGrow) - Strict Trade Safe */}
          {learningTitle ? (
            <Card className="border-blue-500/30 bg-gradient-to-r from-blue-50/40 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 shadow-sm">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        {t.learningHeader}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-foreground">
                      {learningTitle}
                    </h4>
                    {learningReason && (
                      <p className="text-xs text-muted-foreground max-w-xl">
                        {learningReason}
                      </p>
                    )}
                  </div>
                </div>

                <Link href="/worker/grow" className="flex-shrink-0 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4 shadow-sm"
                  >
                    <span>{t.openCourseBtn}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{t.noCourseMsg}</span>
            </div>
          )}

          {/* Important Note Card */}
          {advice.important_note && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  {t.disclaimerTitle}
                </strong>
                <span>{advice.important_note}</span>
              </div>
            </div>
          )}

          {/* Disclaimer Pill */}
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground italic">
              {advice.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions & Navigation Bar */}
      <div className="pt-4 space-y-3">
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
                    {t.skillsLabel}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Update profile
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
                    My Schedule
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Jobs & hours
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
                    Free courses
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
                    Payments & tips
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
