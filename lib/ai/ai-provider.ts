import type {
  DemandForecastContext,
  AiDemandForecastResponse,
  FederationDemandContext,
  FederationAiIntelligenceResponse,
  WorkerAiContext,
  WorkerAiAdviceResponse,
  WorkerAiLanguage,
} from "./ai-types";
import {
  callGroqDemandForecast,
  callGroqFederationIntelligence,
  callGroqWorkerAssistant,
} from "./groq-client";
import {
  generateDeterministicFallback,
  generateFederationDeterministicFallback,
  generateWorkerDeterministicFallback,
} from "./ai-fallback";

/**
 * Isolated AI Provider
 *
 * Safe, isolated facade for advisory intelligence.
 * Guarantees zero crashes: all external failures cleanly degrade to deterministic platform intelligence.
 */
export class AiProvider {
  async getDemandForecast(
    context: DemandForecastContext
  ): Promise<AiDemandForecastResponse> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      console.warn(
        "[AiProvider] GROQ_API_KEY environment variable is not configured. Serving deterministic fallback."
      );
      return generateDeterministicFallback(
        context,
        "API key not configured"
      );
    }

    try {
      return await callGroqDemandForecast(apiKey, context);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Service error";
      console.warn(
        `[AiProvider] Groq advisory call failed (${errorMsg}). Serving deterministic platform fallback.`
      );
      return generateDeterministicFallback(context, errorMsg);
    }
  }

  async getFederationIntelligence(
    context: FederationDemandContext
  ): Promise<FederationAiIntelligenceResponse> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      console.warn(
        "[AiProvider] GROQ_API_KEY environment variable is not configured. Serving federation deterministic fallback."
      );
      return generateFederationDeterministicFallback(
        context,
        "API key not configured"
      );
    }

    try {
      return await callGroqFederationIntelligence(apiKey, context);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Service error";
      console.warn(
        `[AiProvider] Groq federation intelligence call failed (${errorMsg}). Serving deterministic platform fallback.`
      );
      return generateFederationDeterministicFallback(context, errorMsg);
    }
  }

  async getWorkerAdvice(
    context: WorkerAiContext,
    language: WorkerAiLanguage = "hi"
  ): Promise<WorkerAiAdviceResponse> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      console.warn(
        "[AiProvider] GROQ_API_KEY environment variable is not configured. Serving worker deterministic fallback."
      );
      return generateWorkerDeterministicFallback(
        context,
        language,
        "API key not configured"
      );
    }

    try {
      return await callGroqWorkerAssistant(apiKey, context, language);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Service error";
      console.warn(
        `[AiProvider] Groq worker assistant call failed (${errorMsg}). Serving deterministic platform fallback.`
      );
      return generateWorkerDeterministicFallback(context, language, errorMsg);
    }
  }
}

export const aiProvider = new AiProvider();
