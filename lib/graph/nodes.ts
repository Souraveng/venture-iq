// lib/graph/nodes.ts
import { llm } from "./llm";
import { VentureStateType } from "./state";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";


export async function researchAgent(state: VentureStateType) {
  console.log("--- Agent: Researcher ---");
  
  try {
    const tool = new TavilySearch({ 
      maxResults: 3,
      tavilyApiKey: process.env.TAVILY_API_KEY ?? ""
    });
    
    const query = state.researchPlan.join(" ");
    const results = await tool.invoke({ query });
    
    return { 
      gatheredFacts: [results],
      marketIntel: { rawResearch: results } 
    };
  } catch (error) {
    console.error("Research Agent Error:", error);
    throw error;
  }
}
// Define schema for structured output
const IntentSchema = z.object({
  summary: z.string(),
  researchPlan: z.array(z.string()),
});

export async function intentAgent(state: VentureStateType) {
  console.log("--- Agent: Intent Analyzer ---");
  const prompt = `Analyze this venture: ${JSON.stringify(state.userInput)}. Mode: ${state.mode}. 
  Provide a summary and a list of 3 research topics.`;
  
  const structuredLlm = llm.withStructuredOutput(IntentSchema);
  const result = await structuredLlm.invoke(prompt);
  
  return { 
    researchPlan: result.researchPlan,
    finalReport: { summary: result.summary } 
  };
}