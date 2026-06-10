// lib/graph/analyst.ts
import { llm } from "./llm";
import { VentureStateType } from "./state";
import { z } from "zod";

const AnalysisSchema = z.object({
  readinessScore: z.number().describe("0-100 score based on market, finance, and risks"),
  verdict: z.string().describe("Verdict: Proceed, Caution, or Stop"),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  financialProjection: z.string().describe("Estimated break-even and capital needed"),
});

export async function analystAgent(state: VentureStateType) {
  console.log("--- Agent: Venture Analyst ---");
  const prompt = `
  You are an expert Venture Capital Analyst evaluating a startup.
  Venture Idea: ${JSON.stringify(state.userInput)}
  Market Research: ${JSON.stringify(state.marketIntel)}
  
  Perform a deep-dive analysis. Be critical.
  `;
  
  const structuredLlm = llm.withStructuredOutput(AnalysisSchema);
  const result = await structuredLlm.invoke(prompt);
  
  return { 
    finalReport: { ...state.finalReport, ...result },
    marketIntel: { ...state.marketIntel, swot: { 
        strengths: result.strengths, 
        weaknesses: result.weaknesses, 
        opportunities: result.opportunities, 
        threats: result.threats 
    }},
    financialIntel: { projection: result.financialProjection }
  };
}