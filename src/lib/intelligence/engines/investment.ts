import { EngineContext, createFinding } from "../types";
import { generateText } from "ai";
import { getDiligenceModel } from "../ai-client";

export async function runInvestmentEngine(context: EngineContext): Promise<void> {
  const { input, result } = context;

  try {
    const prompt = `Evaluate the market readiness and investment thesis for the following startup profile:
Name: ${input.startup.name}
Tagline: ${input.startup.tagline}
Category: ${input.startup.category}
Stage: ${input.startup.stage}
Target Amount: ${input.startup.targetAmount}

Determine if this startup aligns with typical Venture Capital investment theses and identify any primary founder or market concerns. Keep it concise.`;

    const response = await generateText({
      model: getDiligenceModel(),
      prompt,
    });

    result.findings.push(
      createFinding(
        "investment-intelligence",
        "Market Readiness (AI Evaluated)",
        response.text,
        "SUPPORTED",
        0.8
      )
    );
  } catch (error) {
    console.error("Investment Engine AI Error:", error);
    result.findings.push(
      createFinding(
        "investment-intelligence",
        "Market Readiness",
        "Investment thesis evaluation failed due to an AI generation error. Please verify Azure OpenAI configuration and run 'az login'.",
        "INSUFFICIENT_EVIDENCE",
        null
      )
    );
  }

  result.completedWorkerIds.push("investment-intelligence");
}
