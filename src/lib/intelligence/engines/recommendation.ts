import { generateText, Output } from "ai";
import { z } from "zod";
import { intelligenceModel } from "../azure-ai";
import { EngineContext } from "../types";

export async function runRecommendationEngine(context: EngineContext): Promise<void> {
  const { input, result } = context;

  try {
    const aiResponse = await generateText({
      model: intelligenceModel,
      output: Output.object({
        schema: z.object({
          recommendations: z.array(z.object({
            type: z.enum(["INVEST", "MONITOR", "PASS", "REQUEST_INFORMATION", "NEXT_STEP"]),
            title: z.string(),
            rationale: z.string(),
            priority: z.number(),
            confidence: z.number().min(0).max(1),
          })),
        })
      }),
      system: "You are an expert venture capital analyst. Provide investment recommendations based on the findings.",
      prompt: `Analyze these findings and recommend actions: ${JSON.stringify(result.findings)}. Consider these scenario overrides if they exist: ${JSON.stringify(input.scenarioOverrides || {})}`,
    });

    result.recommendations.push(...aiResponse.output.recommendations);
  } catch (error: any) {
    console.warn("AI Quota hit or error in recommendation, falling back to deterministic recommendations.", error?.message);
    
    // Deterministic fallback
    const activeStartup = { ...input.startup, ...(input.scenarioOverrides || {}) };
    const hasRevenue = !!activeStartup.monthlyRevenue && activeStartup.monthlyRevenue.trim() !== "0" && activeStartup.monthlyRevenue.trim() !== "";
    const hasBurn = !!activeStartup.monthlyBurn && activeStartup.monthlyBurn.trim() !== "0" && activeStartup.monthlyBurn.trim() !== "";

    if (input.availableDocumentCount === 0) {
      result.recommendations.push({
        type: "REQUEST_INFORMATION",
        title: "Request core diligence documents",
        rationale: "No pitch deck, business plan, or financial model was available in the captured profile.",
        priority: 1,
        confidence: 1,
      });
    }
    
    if (!hasRevenue || !hasBurn) {
      result.recommendations.push({
        type: "REQUEST_INFORMATION",
        title: "Request monthly revenue and burn",
        rationale: "Both values are required before the financial engine can calculate an operating profile or runway.",
        priority: 2,
        confidence: 1,
      });
    }
    
    if (input.missingFields.length > 0) {
      result.recommendations.push({
        type: "REQUEST_INFORMATION",
        title: "Close profile input gaps",
        rationale: `Collect: ${input.missingFields.join(", ")}.`,
        priority: 3,
        confidence: 1,
      });
    }
    
    if (result.recommendations.length === 0) {
      result.recommendations.push({
        type: "NEXT_STEP",
        title: "Begin evidence verification",
        rationale: "The foundational profile is complete. The next phase should verify documents and collect approved external evidence before a recommendation is produced.",
        priority: 1,
        confidence: 0.7,
      });
    }
  }

  result.completedWorkerIds.push("recommendation");
}
