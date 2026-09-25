"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/smartserve/PageHeader";
import { SmartAssistantCard } from "@/components/smartserve/SmartAssistantCard";
import { AnalysisResultCard } from "@/components/smartserve/AnalysisResultCard";
import { ServiceDetailsModal } from "@/components/smartserve/ServiceDetailsModal";
import { analyzeProblem } from "@/lib/smartserve-ai";
import { AnalysisResult } from "@/types/smartserve";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function CustomerSmartServePage() {
  const { locale } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);

  const handleAnalyze = async (
    text: string,
    imageFile: File | null,
    imagePreview: string | null
  ) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("description", text || "");
      formData.append("language", locale);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Exactly ONE API call per Analyze click
      const res = await fetch("/api/analyze-service", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        // Handle HTTP 429 Quota Exceeded without fake fallback or automatic retries
        if (res.status === 429 || errData.error === "GEMINI_QUOTA_EXCEEDED") {
          setAnalysisResult(null);
          setApiError("AI analysis is temporarily unavailable because the Gemini API request limit has been reached. Please try again later.");
          return;
        }

        throw new Error(errData.error || `Server analysis error (${res.status})`);
      }

      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      const errMsg = (err as Error)?.message || String(err);
      console.warn("API request failed, executing fallback analysis:", errMsg);
      // Fallback for non-quota errors (e.g. unconfigured key or offline)
      const fallbackResult = analyzeProblem(text, Boolean(imagePreview));
      setAnalysisResult(fallbackResult);
      setApiError(`Notice: Operating in fallback mode (${errMsg || "Gemini API unconfigured"}).`);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        const element = document.getElementById("ai-analysis-result");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setApiError(null);
  };

  const handleViewService = (categoryName: string) => {
    setSelectedCategoryModal(categoryName);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SmartServe Header */}
      <PageHeader />

      {/* AI Smart Assistant Input Card */}
      <section id="ai-smart-assistant">
        <SmartAssistantCard
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          onReset={handleReset}
          hasResult={Boolean(analysisResult)}
        />
      </section>

      {/* API Quota Error / Fallback Warning Toast if any */}
      {apiError && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{apiError}</span>
        </div>
      )}

      {/* AI Result Card Section */}
      {analysisResult && (
        <section id="ai-analysis-result" className="pt-2">
          <AnalysisResultCard
            result={analysisResult}
            onViewService={handleViewService}
            onReset={handleReset}
          />
        </section>
      )}

      {/* Service & Worker Booking Modal */}
      <ServiceDetailsModal
        categoryName={selectedCategoryModal}
        onClose={() => setSelectedCategoryModal(null)}
      />
    </div>
  );
}
