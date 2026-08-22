import { generateText, Output } from "ai";
import { z } from "zod";
import { intelligenceModel } from "../azure-ai";
import { EngineContext, createFinding } from "../types";

export async function runMCDAStrategy(context: EngineContext): Promise<void> {
  const { input, result } = context;

  try {
    const aiResponse = await generateText({
      model: intelligenceModel,
      output: Output.object({
        schema: z.object({
          totalScore: z.number().min(0).max(100),
          components: z.object({
            marketOpportunity: z.number().min(0).max(100),
            competitiveMoat: z.number().min(0).max(100),
            executionCapability: z.number().min(0).max(100),
          }),
          explanation: z.string(),
        })
      }),
      system: "You are an expert venture capital analyst scoring a startup. Produce an MCDA scorecard out of 100.",
      prompt: `Analyze these findings and score the startup: ${JSON.stringify(result.findings)}. Consider these scenario overrides if they exist: ${JSON.stringify(input.scenarioOverrides || {})}`,
    });

    result.scorecards.push({
      framework: "INVESTMENT_VIABILITY",
      totalScore: aiResponse.output.totalScore,
      weights: { marketOpportunity: 0.33, competitiveMoat: 0.33, executionCapability: 0.34 },
      components: aiResponse.output.components,
      explanation: aiResponse.output.explanation,
    });
  } catch (error: any) {
    console.warn("AI Quota hit or error in MCDA, falling back to deterministic scoring.", error?.message);
    
    // Deterministic fallback
    const requiredInputCount = 9;
    const completenessScore = Math.max(0, Math.min(100, Math.round(
      ((requiredInputCount - input.missingFields.length) / requiredInputCount) * 100
    )));
    
    const documentScore = Math.max(0, Math.min(100, Math.round((input.availableDocumentCount / 3) * 100)));
    
    const activeStartup = { ...input.startup, ...(input.scenarioOverrides || {}) };
    const hasRevenue = !!activeStartup.monthlyRevenue && activeStartup.monthlyRevenue.trim() !== "0" && activeStartup.monthlyRevenue.trim() !== "";
    const hasBurn = !!activeStartup.monthlyBurn && activeStartup.monthlyBurn.trim() !== "0" && activeStartup.monthlyBurn.trim() !== "";
    const financialInputScore = hasRevenue && hasBurn ? 100 : hasRevenue || hasBurn ? 50 : 0;
    
    const readinessScore = Math.max(0, Math.min(100, Math.round(
      completenessScore * 0.5 + documentScore * 0.25 + financialInputScore * 0.25
    )));

    result.findings.push(
      createFinding(
        "investment-mcda",
        "Foundational input readiness",
        `The score is ${readinessScore}/100. It measures the availability of diligence inputs, not the quality of the startup or an investment recommendation.`,
        "SUPPORTED",
        1
      )
    );

    result.scorecards.push({
      framework: "FOUNDATIONAL_INPUT_READINESS",
      totalScore: readinessScore,
      weights: { profileCompleteness: 0.5, documentAvailability: 0.25, financialInputAvailability: 0.25 },
      components: { profileCompleteness: completenessScore, documentAvailability: documentScore, financialInputAvailability: financialInputScore },
      explanation: "A data-readiness measure only. It cannot be interpreted as an investment recommendation until evidence verification is complete.",
    });
  }

  result.completedWorkerIds.push("investment-mcda");
}

