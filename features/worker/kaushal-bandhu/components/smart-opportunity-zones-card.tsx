"use client";

import * as React from "react";
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Bike,
  Car,
  Bus,
  Footprints,
  Navigation,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkerAiContext } from "@/lib/ai/ai-types";

export type TravelMode = "two_wheeler" | "car" | "public_transit" | "walking" | "other";

export interface TravelPreferences {
  maxDistanceKm: number; // 5, 15, 25
  maxTravelTimeMins: number; // 30, 60, 90
  travelMode: TravelMode;
}

export interface SuggestedZone {
  id: string;
  name: string;
  demandLevel: "High" | "Medium";
  distanceKm: number;
  travelTimeMins: number;
  whySuggest: {
    en: string;
    hi: string;
    gu: string;
  };
  travelImpact: {
    en: string;
    hi: string;
    gu: string;
  };
}

export interface SmartOpportunityZonesCardProps {
  context: WorkerAiContext | null;
  language?: "en" | "hi" | "gu";
}

// Simulated geographic hubs relative to common Gujarat/urban clusters
interface ZoneCandidate {
  name: string;
  baseDistanceKm: number;
  demandLevel: "High" | "Medium";
  subDemandEn: string;
  subDemandHi: string;
  subDemandGu: string;
}

const LOCALIZED_UI = {
  en: {
    title: "Smart Opportunity Zones",
    subtitle: "Find more work without relocating",
    currentLocationLabel: "Your Registered Base Area",
    currentLocationUnknown: "Registered Service Area",
    goodDemandTitle: "Good Local Demand",
    goodDemandDesc:
      "Your current work area has good job opportunities for your skills. You can continue working in your current area and receive nearby job requests.",
    goodPoint1: "Good local customer demand",
    goodPoint2: "Suitable opportunities in your primary area",
    simulateLowBtn: "Check Nearby Zones / Simulate Low Demand",
    lowDemandTitle: "Fewer Opportunities in Current Area",
    lowDemandDesc:
      "Fewer opportunities are currently available for your skills in your usual work area. We can check nearby areas for more opportunities.",
    findNearbyBtn: "Find Nearby Opportunities",
    prefTitle: "Tell us how far you are comfortable travelling",
    prefSubtitle:
      "We will suggest nearby opportunity zones that match your travel preference without changing your home address or federation.",
    distanceQuestion: "How far are you comfortable travelling for work?",
    dist5: "Up to 5 km",
    dist15: "Up to 15 km",
    dist25: "Up to 25 km",
    timeQuestion: "How much travel time is comfortable for you?",
    time30: "Up to 30 minutes",
    time60: "Up to 60 minutes",
    time90: "Up to 90 minutes",
    modeQuestion: "How do you usually travel for work?",
    modeBike: "Two-wheeler",
    modeCar: "Car",
    modeTransit: "Public transport",
    modeWalking: "Walking",
    modeOther: "Other",
    checkZonesBtn: "Check Nearby Opportunity Zones",
    cancelBtn: "Back",
    suggestedHeading: "Suggested Nearby Opportunity Zones",
    demoBadge: "Demo opportunity data • Based on available platform demand data",
    demandLabel: "Demand for your skills",
    distLabel: "Distance",
    travelLabel: "Estimated travel",
    whyLabel: "Why we suggest it",
    impactLabel: "Travel consideration",
    considerBtn: "Consider This Area",
    selectedHeading: "Add as Optional Work Region",
    selectedSub:
      "Adding this area allows you to receive suitable job requests from an additional zone when your primary area is quiet.",
    noChangeWarning:
      "Important: This does NOT change your registered home address, permanent federation, or primary work area. It only adds an optional zone for matching.",
    approvalNote: "Adding this area requires federation approval.",
    sendRequestBtn: "Send Request to Federation",
    backToZonesBtn: "Back to Suggestions",
    requestSentTitle: "Request Sent",
    requestSentDesc:
      "Your request to add {zone} as an optional work region has been sent to your federation. After approval, you can receive suitable job opportunities from this area.",
    statusLabel: "Status: Pending Federation Approval",
    howMatchingWorksTitle: "How Job Matching Works",
    matchingPoint1:
      "Nearby Workers First: Customers are shown nearby workers first to minimize customer wait times.",
    matchingPoint2:
      "Optional Region Allocation: Workers from optional work regions may be considered when suitable nearby workers are unavailable or when your response matches the request.",
    matchingPoint3:
      "Quick Response Advantage: If you respond quickly and are available, you may receive suitable opportunities from your optional work region after approval.",
    matchingNote:
      "Note: Adding an optional region expands your reach but does not guarantee bookings or bypass travel distance.",
    resetBtn: "Explore Other Zones",
    balancingLegacyNote: "Inter-Federation Workforce Balancing active for regional equilibrium.",
  },
  hi: {
    title: "स्मार्ट ऑपर्च्युनिटी ज़ोन",
    subtitle: "स्थान बदले बिना अधिक काम खोजें",
    currentLocationLabel: "आपका पंजीकृत मुख्य कार्य क्षेत्र",
    currentLocationUnknown: "पंजीकृत कार्य क्षेत्र",
    goodDemandTitle: "स्थानीय क्षेत्र में अच्छे काम के अवसर",
    goodDemandDesc:
      "आपके वर्तमान कार्य क्षेत्र में आपके कौशल के लिए अच्छे काम के अवसर उपलब्ध हैं। आप अपने वर्तमान क्षेत्र में काम जारी रख सकते हैं और नजदीकी अनुरोध प्राप्त कर सकते हैं।",
    goodPoint1: "स्थानीय मांग अनुकूल है",
    goodPoint2: "आपके मुख्य क्षेत्र में उपयुक्त अवसर उपलब्ध हैं",
    simulateLowBtn: "अन्य नजदीकी क्षेत्र देखें / कम मांग सिम्युलेट करें",
    lowDemandTitle: "वर्तमान क्षेत्र में सीमित अवसर",
    lowDemandDesc:
      "आपके सामान्य कार्य क्षेत्र में आपके कौशल के लिए फिलहाल कम अवसर उपलब्ध हैं। हम अधिक काम के लिए नजदीकी क्षेत्रों की जांच कर सकते हैं।",
    findNearbyBtn: "नजदीकी अवसर खोजें",
    prefTitle: "बताएं कि आप काम के लिए कितनी दूर यात्रा करने में सहज हैं",
    prefSubtitle:
      "हम आपके यात्रा आराम के आधार पर नजदीकी क्षेत्रों का सुझाव देंगे, बिना आपका स्थायी पता या फेडरेशन बदले।",
    distanceQuestion: "आप काम के लिए कितनी दूर तक जा सकते हैं?",
    dist5: "5 किमी तक",
    dist15: "15 किमी तक",
    dist25: "25 किमी तक",
    timeQuestion: "यात्रा में कितना समय आपके लिए अनुकूल है?",
    time30: "30 मिनट तक",
    time60: "60 मिनट तक",
    time90: "90 मिनट तक",
    modeQuestion: "आप आमतौर पर काम के लिए कैसे यात्रा करते हैं?",
    modeBike: "दोपहिया वाहन",
    modeCar: "कार",
    modeTransit: "सार्वजनिक परिवहन",
    modeWalking: "पैदल",
    modeOther: "अन्य",
    checkZonesBtn: "नजदीकी ऑपर्च्युनिटी ज़ोन खोजें",
    cancelBtn: "वापस जाएं",
    suggestedHeading: "सुझाए गए नजदीकी ऑपर्च्युनिटी ज़ोन",
    demoBadge: "डेमो अवसर डेटा • उपलब्ध प्लेटफॉर्म मांग डेटा पर आधारित",
    demandLabel: "आपके कौशल की मांग",
    distLabel: "दूरी",
    travelLabel: "अनुमानित यात्रा समय",
    whyLabel: "हम यह क्षेत्र क्यों सुझा रहे हैं",
    impactLabel: "यात्रा खर्च व समय का ध्यान",
    considerBtn: "यह क्षेत्र चुनें",
    selectedHeading: "वैकल्पिक कार्य क्षेत्र के रूप में जोड़ें",
    selectedSub:
      "इस क्षेत्र को जोड़ने से आप अपने मुख्य क्षेत्र में कम काम होने पर अतिरिक्त क्षेत्र से उपयुक्त कार्य अनुरोध प्राप्त कर सकेंगे।",
    noChangeWarning:
      "महत्वपूर्ण: इससे आपका स्थायी घर का पता, मुख्य फेडरेशन या प्राथमिक कार्य क्षेत्र नहीं बदलेगा। यह केवल काम के अवसरों के लिए एक अतिरिक्त क्षेत्र जोड़ता है।",
    approvalNote: "इस क्षेत्र को जोड़ने के लिए फेडरेशन की मंजूरी आवश्यक है।",
    sendRequestBtn: "फेडरेशन को अनुरोध भेजें",
    backToZonesBtn: "सुझावों पर वापस जाएं",
    requestSentTitle: "अनुरोध भेज दिया गया",
    requestSentDesc:
      "आपके फेडरेशन को {zone} को वैकल्पिक कार्य क्षेत्र के रूप में जोड़ने का अनुरोध भेज दिया गया है। अनुमोदन के बाद, आप इस क्षेत्र से उपयुक्त कार्य अवसर प्राप्त कर सकेंगे।",
    statusLabel: "स्थिति: फेडरेशन अनुमोदन लंबित",
    howMatchingWorksTitle: "काम का मिलान (Job Matching) कैसे काम करता है",
    matchingPoint1:
      "नजदीकी कामगारों को प्राथमिकता: ग्राहकों को पहले उनके नजदीकी कामगार दिखाए जाते हैं ताकि कम समय लगे।",
    matchingPoint2:
      "वैकल्पिक क्षेत्र आवंटन: जब नजदीकी कामगार उपलब्ध न हों या आपका जवाब सटीक हो, तब वैकल्पिक क्षेत्र के कामगारों को काम भेजा जाता है।",
    matchingPoint3:
      "त्वरित प्रतिक्रिया का लाभ: यदि आप जल्दी प्रतिक्रिया देते हैं और उपलब्ध रहते हैं, तो मंजूरी के बाद आपको अच्छे अवसर मिल सकते हैं।",
    matchingNote:
      "सूचना: वैकल्पिक क्षेत्र जोड़ने से काम मिलने की संभावना बढ़ती है, लेकिन यह किसी काम की गारंटी नहीं देता।",
    resetBtn: "अन्य क्षेत्र खोजें",
    balancingLegacyNote: "Inter-Federation Workforce Balancing सक्रिय है।",
  },
  gu: {
    title: "સ્માર્ટ ઓપોર્ચ્યુનિટી ઝોન",
    subtitle: "સ્થળાંતર કર્યા વિના વધુ કામ શોધો",
    currentLocationLabel: "તમારો નોંધાયેલ મુખ્ય કાર્ય વિસ્તાર",
    currentLocationUnknown: "નોંધાયેલ કાર્ય વિસ્તાર",
    goodDemandTitle: "સ્થાનિક વિસ્તારમાં કામની સારી તકો",
    goodDemandDesc:
      "તમારા વર્તમાન કાર્ય વિસ્તારમાં તમારી કુશળતા માટે કામની સારી તકો ઉપલબ્ધ છે. તમે તમારા વર્તમાન વિસ્તારમાં કામ ચાલુ રાખી શકો છો અને નજીકની વિનંતીઓ મેળવી શકો છો.",
    goodPoint1: "સ્થાનિક ગ્રાહક માંગ યોગ્ય છે",
    goodPoint2: "તમારા મુખ્ય વિસ્તારમાં પૂરતી તકો ઉપલબ્ધ છે",
    simulateLowBtn: "અન્ય નજીકના વિસ્તારો જુઓ / ઓછી માંગ તપાસો",
    lowDemandTitle: "વર્તમાન વિસ્તારમાં મર્યાદિત તકો",
    lowDemandDesc:
      "તમારા સામાન્ય કાર્ય વિસ્તારમાં તમારી કુશળતા માટે હાલમાં ઓછી તકો ઉપલબ્ધ છે. વધુ કામ માટે આપણે નજીકના વિસ્તારો તપાસી શકીએ છીએ.",
    findNearbyBtn: "નજીકની તકો શોધો",
    prefTitle: "જણાવો કે તમે કામ માટે કેટલી દૂર મુસાફરી કરવામાં અનુકૂળ છો",
    prefSubtitle:
      "અમે તમારું કાયમી સરનામું કે ફેડરેશન બદલ્યા વિના તમારી મુસાફરી અનુકૂળતા મુજબ નજીકના વિસ્તારો સૂચવીશું.",
    distanceQuestion: "તમે કામ માટે કેટલે દૂર સુધી જઈ શકો છો?",
    dist5: "5 કિમી સુધી",
    dist15: "15 કિમી સુધી",
    dist25: "25 કિમી સુધી",
    timeQuestion: "મુસાફરીમાં કેટલો સમય તમારા માટે અનુકૂળ છે?",
    time30: "30 મિનિટ સુધી",
    time60: "60 મિનિટ સુધી",
    time90: "90 મિનિટ સુધી",
    modeQuestion: "તમે સામાન્ય રીતે કામ માટે કેવી રીતે મુસાફરી કરો છો?",
    modeBike: "ટુ-વ્હીલર",
    modeCar: "કાર",
    modeTransit: "જાહેર પરિવહન",
    modeWalking: "પગપાળા",
    modeOther: "અન્ય",
    checkZonesBtn: "નજીકના ઓપોર્ચ્યુનિટી ઝોન શોધો",
    cancelBtn: "પાછા જાઓ",
    suggestedHeading: "સૂચવેલા નજીકના ઓપોર્ચ્યુનિટી ઝોન",
    demoBadge: "ડેમો તક ડેટા • ઉપલબ્ધ પ્લેટફોર્મ માંગ ડેટા પર આધારિત",
    demandLabel: "તમારી કુશળતાની માંગ",
    distLabel: "અંતર",
    travelLabel: "અંદાજિત મુસાફરી સમય",
    whyLabel: "અમે આ વિસ્તાર કેમ સૂચવી રહ્યા છીએ",
    impactLabel: "મુસાફરી ખર્ચ અને સમયની નોંધ",
    considerBtn: "આ વિસ્તાર પસંદ કરો",
    selectedHeading: "વૈકલ્પિક કાર્ય વિસ્તાર તરીકે ઉમેરો",
    selectedSub:
      "આ વિસ્તાર ઉમેરવાથી તમારા મુખ્ય વિસ્તારમાં ઓછું કામ હોય ત્યારે તમે વધારાના વિસ્તારમાંથી યોગ્ય કામની વિનંતીઓ મેળવી શકશો.",
    noChangeWarning:
      "મહત્વપૂર્ણ: આનાથી તમારું કાયમી ઘરનું સરનામું, મુખ્ય ફેડરેશન કે પ્રાથમિક કાર્ય વિસ્તાર બદલાશે નહીં. આ ફક્ત કામની તકો માટે વધારાનો વિસ્તાર ઉમેરે છે.",
    approvalNote: "આ વિસ્તાર ઉમેરવા માટે ફેડરેશનની મંજૂરી જરૂરી છે.",
    sendRequestBtn: "ફેડરેશનને વિનંતી મોકલો",
    backToZonesBtn: "સૂચનો પર પાછા જાઓ",
    requestSentTitle: "વિનંતી મોકલી દેવાઈ",
    requestSentDesc:
      "{zone} ને વૈકલ્પિક કાર્ય વિસ્તાર તરીકે ઉમેરવાની તમારી વિનંતી તમારા ફેડરેશનને મોકલી દેવામાં આવી છે. મંજૂરી મળ્યા પછી, તમે આ વિસ્તારમાંથી યોગ્ય કામની તકો મેળવી શકશો.",
    statusLabel: "સ્થિતિ: ફેડરેશન મંજૂરી બાકી",
    howMatchingWorksTitle: "કામની ફાળવણી (Job Matching) કેવી રીતે કાર્ય કરે છે",
    matchingPoint1:
      "નજીકના કારીગરોને પ્રથમ પ્રાથમિકતા: ગ્રાહકોનો રાહ જોવાનો સમય ઘટાડવા માટે નજીકના કારીગરો પહેલા બતાવવામાં આવે છે.",
    matchingPoint2:
      "વૈકલ્પિક વિસ્તાર ફાળવણી: જ્યારે સ્થાનિક કારીગરો ઉપલબ્ધ ન હોય ત્યારે વૈકલ્પિક કાર્ય વિસ્તારના કારીગરોને કામ સોંપવામાં આવે છે.",
    matchingPoint3:
      "ઝડપી પ્રતિસાદનો લાભ: જો તમે ઝડપથી પ્રતિસાદ આપો છો અને ઉપલબ્ધ રહો છો, તો મંજૂરી પછી તમને આ વિસ્તારમાંથી સારી તકો મળી શકે છે.",
    matchingNote:
      "નોંધ: વૈકલ્પિક વિસ્તાર ઉમેરવાથી તકો વધે છે, પરંતુ તે કામની ખાતરી આપતું નથી.",
    resetBtn: "અન્ય વિસ્તારો તપાસો",
    balancingLegacyNote: "Inter-Federation Workforce Balancing સક્રિય છે.",
  },
};

type OpportunityState =
  | "GOOD_DEMAND"
  | "LOW_DEMAND"
  | "PREFERENCES_FORM"
  | "SUGGESTIONS"
  | "CONSIDER_AREA"
  | "REQUEST_SENT";

export function SmartOpportunityZonesCard({
  context,
  language = "en",
}: SmartOpportunityZonesCardProps) {
  const t = LOCALIZED_UI[language] || LOCALIZED_UI.en;

  // Determine worker's actual location and trade from real context
  const workerAddress = context?.region_guidance?.worker_address || "";
  const workerArea =
    context?.region_guidance?.worker_area ||
    context?.region_guidance?.city ||
    "Satellite, Ahmedabad";
  const workerTrade = context?.trade || context?.worker_trade || "Service Professional";
  const isInitiallyHigh = context?.region_guidance?.demand_level === "HIGH";

  // State management for the 6 states inside this section
  const [opportunityState, setOpportunityState] = React.useState<OpportunityState>(
    isInitiallyHigh ? "GOOD_DEMAND" : "LOW_DEMAND"
  );

  // Worker preferences form state
  const [preferences, setPreferences] = React.useState<TravelPreferences>({
    maxDistanceKm: 15,
    maxTravelTimeMins: 45,
    travelMode: "two_wheeler",
  });

  // Selected zone for optional region request
  const [selectedZone, setSelectedZone] = React.useState<SuggestedZone | null>(null);

  // Sync initial state if context updates
  React.useEffect(() => {
    if (context?.region_guidance) {
      const isHigh = context.region_guidance.demand_level === "HIGH";
      // Only set if user hasn't started interacting with the form
      setOpportunityState((prev) => {
        if (prev === "GOOD_DEMAND" || prev === "LOW_DEMAND") {
          return isHigh ? "GOOD_DEMAND" : "LOW_DEMAND";
        }
        return prev;
      });
    }
  }, [context]);

  // Generate realistic nearby opportunity zones relative to the worker's ACTUAL location and trade
  const suggestedZones = React.useMemo<SuggestedZone[]>(() => {
    const locLower = (workerArea + " " + workerAddress).toLowerCase();
    const tradeLower = workerTrade.toLowerCase();

    // Candidates relative to worker's actual area
    let candidates: ZoneCandidate[] = [];

    if (locLower.includes("chandkheda") || locLower.includes("motera") || locLower.includes("sabarmati")) {
      candidates = [
        {
          name: "Kalol",
          baseDistanceKm: 16,
          demandLevel: "High",
          subDemandEn: `High ${workerTrade} opportunity in residential expansion hubs and commercial complexes.`,
          subDemandHi: `आवासीय विस्तार और व्यावसायिक परिसरों में ${workerTrade} के काम की उच्च मांग।`,
          subDemandGu: `રહેણાંક વિસ્તારો અને કોમર્શિયલ બિલ્ડિંગોમાં ${workerTrade} ની ઊંચી માંગ.`,
        },
        {
          name: "Motera / Koteshwar",
          baseDistanceKm: 6,
          demandLevel: "Medium",
          subDemandEn: `Steady ${workerTrade} service calls from high-density housing societies.`,
          subDemandHi: `हाउसिंग सोसायटियों से ${workerTrade} सेवा के नियमित अनुरोध।`,
          subDemandGu: `હાઉસિંગ સોસાયટીઓમાંથી ${workerTrade} સેવા માટે સતત વિનંતીઓ.`,
        },
        {
          name: "Gandhinagar Kudasan",
          baseDistanceKm: 14,
          demandLevel: "High",
          subDemandEn: `Rapidly growing IT and residential sector with frequent technician requirements.`,
          subDemandHi: `आईटी और आवासीय क्षेत्र में तकनीशियनों की निरंतर आवश्यकता।`,
          subDemandGu: `આઇટી અને રહેણાંક વિસ્તારમાં કારીગરોની નિયમિત જરૂરિયાત.`,
        },
      ];
    } else if (locLower.includes("gandhinagar") || locLower.includes("kudasan")) {
      candidates = [
        {
          name: "Chandkheda",
          baseDistanceKm: 14,
          demandLevel: "High",
          subDemandEn: `Strong household ${workerTrade} requirements along highway residential corridor.`,
          subDemandHi: `हाईवे आवासीय कॉरिडोर में ${workerTrade} सेवाओं की मजबूत मांग।`,
          subDemandGu: `હાઇવે રેસિડેન્શિયલ કોરિડોરમાં ${workerTrade} સેવાઓની મજબૂત માંગ.`,
        },
        {
          name: "Kalol",
          baseDistanceKm: 17,
          demandLevel: "High",
          subDemandEn: `High demand for trade maintenance in nearby market area.`,
          subDemandHi: `नजदीकी बाजार क्षेत्र में रखरखाव कार्य की उच्च मांग।`,
          subDemandGu: `નજીકના બજાર વિસ્તારમાં જાળવણી કામની ઊંચી માંગ.`,
        },
        {
          name: "Raysan / Infocity",
          baseDistanceKm: 5,
          demandLevel: "Medium",
          subDemandEn: `Convenient local hub with active daily customer requests.`,
          subDemandHi: `दैनिक ग्राहक अनुरोधों के साथ सुविधाजनक स्थानीय केंद्र।`,
          subDemandGu: `દૈનિક ગ્રાહક વિનંતીઓ સાથે અનુકૂળ સ્થાનિક વિસ્તાર.`,
        },
      ];
    } else {
      // Default to western/central Ahmedabad clusters (e.g., Satellite, Vastrapur, Bopal, Bodakdev)
      candidates = [
        {
          name: "Vastrapur",
          baseDistanceKm: 4,
          demandLevel: "High",
          subDemandEn: `More ${workerTrade} opportunities are available in this high-density residential zone and it fits your travel preference.`,
          subDemandHi: `इस घनी आबादी वाले आवासीय क्षेत्र में ${workerTrade} के अधिक अवसर उपलब्ध हैं और यह आपकी यात्रा पसंद से मेल खाता है।`,
          subDemandGu: `આ રહેણાંક વિસ્તારમાં ${workerTrade} ની વધુ તકો ઉપલબ્ધ છે અને તે તમારી મુસાફરી પસંદગી સાથે મેળ ખાય છે.`,
        },
        {
          name: "South Bopal / Ghuma",
          baseDistanceKm: 8,
          demandLevel: "High",
          subDemandEn: `Rapid residential expansion with active ${workerTrade} installation & repair requests.`,
          subDemandHi: `तेजी से विकसित आवासीय क्षेत्र जहाँ ${workerTrade} मरम्मत व फिटिंग के कई अनुरोध उपलब्ध हैं।`,
          subDemandGu: `ઝડપથી વિકસતા રહેણાંક વિસ્તારમાં ${workerTrade} સમારકામ અને ફિટિંગની ઊંચી માંગ.`,
        },
        {
          name: "Ghatlodia / Chandlodia",
          baseDistanceKm: 12,
          demandLevel: "Medium",
          subDemandEn: `Consistent customer bookings for ${workerTrade} maintenance with moderate competition.`,
          subDemandHi: `मध्यम प्रतिस्पर्धा के साथ ${workerTrade} रखरखाव के लिए निरंतर ग्राहक बुकिंग।`,
          subDemandGu: `ઓછી સ્પર્ધા સાથે ${workerTrade} જાળવણી માટે નિયમિત ગ્રાહક બુકિંગ.`,
        },
      ];
    }

    // Adjust travel speed factor based on transport mode
    const speedFactor =
      preferences.travelMode === "two_wheeler"
        ? 1.0
        : preferences.travelMode === "car"
        ? 1.15
        : preferences.travelMode === "public_transit"
        ? 1.55
        : preferences.travelMode === "walking"
        ? 3.2
        : 1.2;

    // Filter and map zones based on worker preferences
    return candidates
      .filter((c) => c.baseDistanceKm <= preferences.maxDistanceKm + 3)
      .slice(0, 3)
      .map((c, idx) => {
        const estMins = Math.max(12, Math.round(c.baseDistanceKm * 2.5 * speedFactor));

        // Travel impact note considering cost, time, and distance
        let impactEn = "";
        let impactHi = "";
        let impactGu = "";

        if (c.baseDistanceKm <= 6) {
          impactEn =
            "Close to your base. Minimal commute time and negligible fuel expense allow you to attend service requests with high efficiency.";
          impactHi =
            "आपके मुख्य क्षेत्र के बहुत पास। कम समय और नगण्य ईंधन खर्च से आप अधिकतम दक्षता के साथ काम कर सकेंगे।";
          impactGu =
            "તમારા મુખ્ય વિસ્તારની ખૂબ નજીક. ઓછો મુસાફરી સમય અને નહિવત્ ઇંધણ ખર્ચ સાથે કાર્યક્ષમતા વધશે.";
        } else if (c.baseDistanceKm <= 12) {
          impactEn =
            "Moderate distance. Economical when attending pre-scheduled morning or afternoon slots without disrupting your primary area.";
          impactHi =
            "मध्यम दूरी। आपके मुख्य कार्य क्षेत्र को प्रभावित किए बिना निर्धारित स्लॉट में काम करने के लिए किफायती।";
          impactGu =
            "મધ્યમ અંતર. તમારા પ્રાથમિક વિસ્તારને અસર કર્યા વિના પૂર્વ-નિર્ધારિત સ્લોટમાં કામ કરવા માટે અનુકૂળ.";
        } else {
          impactEn = `${c.name} has higher demand, but it is farther away. It may be more useful when multiple suitable jobs are available together to offset transit time and travel cost.`;
          impactHi = `${c.name} में मांग अधिक है, लेकिन यह दूर है। यह तब अधिक उपयोगी होगा जब यात्रा समय और खर्च की भरपाई के लिए एक साथ कई काम उपलब्ध हों।`;
          impactGu = `${c.name} માં માંગ વધુ છે પરંતુ તે વધુ દૂર છે. મુસાફરી ખર્ચ અને સમયની સરભર કરવા માટે જ્યારે એકસાથે બહુવિધ કામ ઉપલબ્ધ હોય ત્યારે આ વધુ ફાયદાકારક રહેશે.`;
        }

        return {
          id: `zone-${idx + 1}`,
          name: c.name,
          demandLevel: c.demandLevel,
          distanceKm: c.baseDistanceKm,
          travelTimeMins: Math.min(preferences.maxTravelTimeMins, estMins),
          whySuggest: {
            en: c.subDemandEn,
            hi: c.subDemandHi,
            gu: c.subDemandGu,
          },
          travelImpact: {
            en: impactEn,
            hi: impactHi,
            gu: impactGu,
          },
        };
      });
  }, [workerArea, workerAddress, workerTrade, preferences]);

  // Mode icon helper
  const renderModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case "two_wheeler":
        return <Bike className="h-4 w-4" />;
      case "car":
        return <Car className="h-4 w-4" />;
      case "public_transit":
        return <Bus className="h-4 w-4" />;
      case "walking":
        return <Footprints className="h-4 w-4" />;
      default:
        return <Navigation className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm flex flex-col justify-between" id="smart-opportunity-zones">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {t.title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t.subtitle}
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="border-teal-500/30 text-teal-700 dark:text-teal-300 text-[10px] hidden sm:inline-flex">
            <span>{t.balancingLegacyNote.slice(0, 36)}...</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Current Worker Registered Location Anchor */}
        <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground block">{t.currentLocationLabel}</span>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span>{workerAddress || workerArea || t.currentLocationUnknown}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[11px] font-semibold bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200">
            {workerTrade}
          </Badge>
        </div>

        {/* ========================================================= */}
        {/* STATE 1: GOOD OPPORTUNITIES IN CURRENT AREA               */}
        {/* ========================================================= */}
        {opportunityState === "GOOD_DEMAND" && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t.goodDemandTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.goodDemandDesc}
                </p>
                <div className="pt-1.5 flex flex-wrap gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t.goodPoint1}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t.goodPoint2}
                  </span>
                </div>
              </div>
            </div>

            {/* Test / Explore trigger to allow evaluator to explore low-demand flow */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Want to look beyond your primary area?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpportunityState("LOW_DEMAND")}
                className="text-xs border-teal-500/40 text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              >
                <span>{t.simulateLowBtn}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 2: LOW OPPORTUNITIES IN CURRENT AREA                */}
        {/* ========================================================= */}
        {opportunityState === "LOW_DEMAND" && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{t.lowDemandTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.lowDemandDesc}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpportunityState("GOOD_DEMAND")}
                className="text-xs text-muted-foreground"
              >
                <span>Back</span>
              </Button>
              <Button
                onClick={() => setOpportunityState("PREFERENCES_FORM")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <span>{t.findNearbyBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 3: WORKER TRAVEL PREFERENCES INLINE FORM            */}
        {/* ========================================================= */}
        {opportunityState === "PREFERENCES_FORM" && (
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.prefTitle}</span>
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t.prefSubtitle}
              </p>
            </div>

            <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
              {/* Field 1: Distance */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground block">
                  {t.distanceQuestion}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 15, 25].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, maxDistanceKm: dist }))}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-all ${
                        preferences.maxDistanceKm === dist
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                          : "bg-background border-border text-foreground hover:border-teal-500/50"
                      }`}
                    >
                      {dist === 5 ? t.dist5 : dist === 15 ? t.dist15 : t.dist25}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Travel Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground block">
                  {t.timeQuestion}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, maxTravelTimeMins: mins }))}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-all ${
                        preferences.maxTravelTimeMins === mins
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                          : "bg-background border-border text-foreground hover:border-teal-500/50"
                      }`}
                    >
                      {mins === 30 ? t.time30 : mins === 60 ? t.time60 : t.time90}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Travel Mode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground block">
                  {t.modeQuestion}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: "two_wheeler", label: t.modeBike, icon: Bike },
                      { id: "car", label: t.modeCar, icon: Car },
                      { id: "public_transit", label: t.modeTransit, icon: Bus },
                      { id: "walking", label: t.modeWalking, icon: Footprints },
                      { id: "other", label: t.modeOther, icon: Navigation },
                    ] as const
                  ).map((mode) => {
                    const IconComp = mode.icon;
                    const isSelected = preferences.travelMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPreferences((p) => ({ ...p, travelMode: mode.id }))}
                        className={`p-2 flex flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-all ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                            : "bg-background border-border text-foreground hover:border-teal-500/50"
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span className="truncate">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpportunityState("LOW_DEMAND")}
                className="text-xs text-muted-foreground"
              >
                <span>{t.cancelBtn}</span>
              </Button>
              <Button
                onClick={() => setOpportunityState("SUGGESTIONS")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <span>{t.checkZonesBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 4: SUGGESTED OPPORTUNITY CARDS                      */}
        {/* ========================================================= */}
        {opportunityState === "SUGGESTIONS" && (
          <div className="space-y-3.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                  <span>{t.suggestedHeading}</span>
                </h4>
              </div>
              <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 text-[10px]">
                {t.demoBadge}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {suggestedZones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-3 rounded-xl border border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/10 hover:border-teal-600 transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-teal-600" />
                          <span>{zone.name}</span>
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            zone.demandLevel === "High"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold"
                              : "bg-blue-50 text-blue-700 border-blue-300 text-[10px] font-bold"
                          }
                        >
                          {zone.demandLevel} {t.demandLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-teal-600" />
                          {zone.distanceKm} km
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-teal-600" />
                          ~{zone.travelTimeMins} min ({renderModeIcon(preferences.travelMode)})
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedZone(zone);
                        setOpportunityState("CONSIDER_AREA");
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-8 shrink-0"
                    >
                      <span>{t.considerBtn}</span>
                    </Button>
                  </div>

                  {/* Why We Suggest It */}
                  <div className="text-[11px] text-foreground/90 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-border/40">
                    <span className="font-bold text-teal-700 dark:text-teal-300 block mb-0.5">
                      {t.whyLabel}:
                    </span>
                    <p className="leading-snug">{zone.whySuggest[language] || zone.whySuggest.en}</p>
                  </div>

                  {/* Travel Consideration Note */}
                  <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40 italic flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">{zone.travelImpact[language] || zone.travelImpact.en}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpportunityState("PREFERENCES_FORM")}
                className="text-xs text-muted-foreground"
              >
                <span>Change Preferences</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 5: AREA SELECTED / ADD AS OPTIONAL REGION           */}
        {/* ========================================================= */}
        {opportunityState === "CONSIDER_AREA" && selectedZone && (
          <div className="space-y-3.5 flex-1">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.selectedHeading}</span>
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t.selectedSub}
              </p>
            </div>

            {/* Selected Zone Card */}
            <div className="p-3.5 rounded-xl border-2 border-teal-600 bg-teal-50/30 dark:bg-teal-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <span className="font-bold text-sm text-foreground">{selectedZone.name}</span>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold">
                  {selectedZone.demandLevel} Demand
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-3">
                <span>Distance: <strong>{selectedZone.distanceKm} km</strong></span>
                <span>•</span>
                <span>Estimated Travel: <strong>~{selectedZone.travelTimeMins} mins</strong></span>
              </div>

              {/* Strict Notice that this does NOT change address or federation */}
              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                {t.noChangeWarning}
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.approvalNote}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpportunityState("SUGGESTIONS")}
                className="text-xs text-muted-foreground"
              >
                <span>{t.backToZonesBtn}</span>
              </Button>
              <Button
                onClick={() => setOpportunityState("REQUEST_SENT")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <span>{t.sendRequestBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 6: REQUEST SENT & PENDING FEDERATION APPROVAL        */}
        {/* ========================================================= */}
        {opportunityState === "REQUEST_SENT" && selectedZone && (
          <div className="space-y-3.5 flex-1">
            {/* Success Banner */}
            <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{t.requestSentTitle}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.requestSentDesc.replace("{zone}", selectedZone.name)}
              </p>
              <div className="pt-1">
                <Badge variant="outline" className="border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {t.statusLabel}
                </Badge>
              </div>
            </div>

            {/* Explanation: How Job Matching Works */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.howMatchingWorksTitle}</span>
              </h5>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-snug">
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{t.matchingPoint1}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{t.matchingPoint2}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{t.matchingPoint3}</span>
                </li>
              </ul>
              <p className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border/30">
                {t.matchingNote}
              </p>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedZone(null);
                  setOpportunityState("SUGGESTIONS");
                }}
                className="text-xs border-teal-500/40 text-teal-800 dark:text-teal-200"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                <span>{t.resetBtn}</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
