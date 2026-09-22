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

const UI_TEXT = {
  hi: {
    title: "कौशल बंधु",
    subtitle: "आपका डिजिटल कार्य और कौशल साथी",
    greetingDefault: "नमस्ते साथी, कौशल बंधु में आपका स्वागत है!",
    desc: "यहाँ आप अपने काम, नई मांग और कौशल विकास के लिए सरल और उपयोगी सुझाव प्राप्त कर सकते हैं।",
    getAdviceBtn: "मार्गदर्शन प्राप्त करें",
    refreshAdviceBtn: "नया सुझाव प्राप्त करें",
    loadingText: "कौशल बंधु आपके लिए उपयोगी सुझाव तैयार कर रहे हैं...",
    tradeLabel: "पंजीकृत कार्य",
    experienceLabel: "अनुभव",
    verifiedLabel: "सत्यापित कारीगर",
    jobsDoneLabel: "पूरे किए गए काम",
    demandLabel: "इलाके में काम की मांग",
    skillsLabel: "आपके कौशल",
    tipsHeader: "आपके लिए महत्वपूर्ण सुझाव",
    learningHeader: "कौशल विकास (KaushalGrow)",
    openCourseBtn: "कोर्स देखें व सीखें",
    quickActionsHeader: "त्वरित सहायता व सेटिंग्स",
    disclaimerTitle: "ज़रूरी सूचना",
    highDemand: "उच्च मांग",
    steadyDemand: "सामान्य मांग",
    lowDemand: "सीमित मांग",
  },
  gu: {
    title: "કૌશલ બંધુ",
    subtitle: "તમારો ડિજિટલ કાર્ય અને કુશળતા સાથી",
    greetingDefault: "નમસ્તે સાથી, કૌશલ બંધુમાં તમારું સ્વાગત છે!",
    desc: "અહીં તમે તમારા કામ, નવી માંગ અને કૌશલ્ય વિકાસ માટે સરળ અને ઉપયોગી માર્ગદર્શન મેળવી શકો છો.",
    getAdviceBtn: "માર્ગદર્શન મેળવો",
    refreshAdviceBtn: "નવું માર્ગદર્શન મેળવો",
    loadingText: "કૌશલ બંધુ તમારા માટે ઉપયોગી સૂચનો તૈયાર કરી રહ્યા છે...",
    tradeLabel: "નોંધાયેલ કામ",
    experienceLabel: "અનુભવ",
    verifiedLabel: "પ્રમાણિત કારીગર",
    jobsDoneLabel: "પૂર્ણ કરેલા કામ",
    demandLabel: "વિસ્તારમાં કામની માંગ",
    skillsLabel: "તમારા કૌશલ્યો",
    tipsHeader: "તમારા માટે મહત્વપૂર્ણ સૂચનો",
    learningHeader: "કૌશલ્ય વિકાસ (KaushalGrow)",
    openCourseBtn: "કોર્સ જુઓ અને શીખો",
    quickActionsHeader: "ઝડપી સહાય અને સેટિંગ્સ",
    disclaimerTitle: "મહત્વપૂર્ણ નોંધ",
    highDemand: "ઊંચી માંગ",
    steadyDemand: "સામાન્ય માંગ",
    lowDemand: "મર્યાદિત માંગ",
  },
  en: {
    title: "Kaushal Bandhu",
    subtitle: "Your Digital Work & Skills Companion",
    greetingDefault: "Hello Partner, welcome to Kaushal Bandhu!",
    desc: "Get simple, respectful guidance for your trade, regional demand insights, and skill growth.",
    getAdviceBtn: "Get Advice",
    refreshAdviceBtn: "Refresh Advice",
    loadingText: "Kaushal Bandhu is preparing your guidance...",
    tradeLabel: "Registered Trade",
    experienceLabel: "Experience",
    verifiedLabel: "Verified Craftsman",
    jobsDoneLabel: "Completed Jobs",
    demandLabel: "Local Area Demand",
    skillsLabel: "Your Skills",
    tipsHeader: "Helpful Tips for You",
    learningHeader: "Skill Development (KaushalGrow)",
    openCourseBtn: "Open Course & Learn",
    quickActionsHeader: "Quick Actions & Navigation",
    disclaimerTitle: "Important Notice",
    highDemand: "High Demand",
    steadyDemand: "Steady Demand",
    lowDemand: "Limited Demand",
  },
};

export function KaushalBandhuView() {
  const [language, setLanguage] = React.useState<WorkerAiLanguage>("hi");
  const [context, setContext] = React.useState<WorkerAiContext | null>(null);
  const [advice, setAdvice] = React.useState<WorkerAiAdviceResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const t = UI_TEXT[language];

  // 1. Initial Load: Fetch factual context only (No Groq invocation on mount to avoid rate limits)
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
            </CardHeader>
          </Card>

          {/* Practical Tips Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground">
                {t.tipsHeader}
              </h3>
            </div>

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
          </div>

          {/* Learning Recommendation (KaushalGrow) */}
          {learningTitle && (
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
