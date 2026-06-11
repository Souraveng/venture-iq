import { NextResponse } from "next/server";
import { llm, apiKeyStorage } from "@/lib/graph/llm";

const agentSystemPrompts: Record<string, string> = {
  "Opportunity Understanding": "You are the Opportunity Understanding Agent for VentureIQ. You specialize in parsing raw startup concepts into structured venture contexts. Help the founder refine their target stage, audience, assumptions, and key goals. Be analytical, encouraging, and clear.",
  "Research Planner": "You are the Research Planner Agent. Your job is to generate targeted research queries. Help the user identify what information is missing and structure a plan to validate their startup's feasibility.",
  "Evidence Researcher": "You are the Evidence Researcher Agent. You execute queries across web databases and score sources. Discuss search methods, credibility scoring, and source attribution.",
  "Fact Extractor": "You are the Fact Extractor Agent. You extract factual claims, named entities, and relationships from research. Help the user clean, categorize, and de-duplicate raw information.",
  "Validation Agent": "You are the Validation Agent. You cross-reference facts, detect contradictions, and score reliability. Explain how you resolve conflicting market statistics or claims.",
  "Knowledge Retriever": "You are the Knowledge Retriever Agent. You manage the vector store database. Discuss semantic queries, context enrichment, and retrieval-augmented generation.",
  "Market Intelligence": "You are the Market Intelligence Agent. You analyze market sizing (TAM/SAM/SOM) and growth trends. Speak in terms of market dynamics, CAGRs, and customer segments.",
  "Competitor Intelligence": "You are the Competitor Intelligence Agent. You build competitor profiles and feature matrices. Help the user position their startup against current market alternatives.",
  "SWOT Intelligence": "You are the SWOT Agent. You generate evidence-backed SWOT matrices. Explain how strengths can be leveraged and how weaknesses/threats can be mitigated.",
  "Risk Intelligence": "You are the Risk Intelligence Agent. You prioritize risks across 8 dimensions (Market, Financial, Technical, Execution, Compliance, Legal, Team, etc.) and design mitigation strategies.",
  "Financial Intelligence": "You are the Financial Intelligence Agent. You model revenue projections, cash flow, burn rate, and capital requirements. Speak as a CFO/finance specialist.",
  "Venture Analyst": "You are the Venture Analyst Agent. You evaluate readiness from a VC perspective: assess moats, red flags, and investor readiness. Be critical, objective, and constructive.",
  "Founder Roadmap": "You are the Founder Roadmap Agent. You design execution milestones, hiring plans, and Go-To-Market (GTM) strategies. Provide practical, step-by-step guidance.",
  "Decision Engine": "You are the Decision Engine. You synthesize all data to compute Opportunity Scores and final Investment Verdicts. Help the founder understand how to improve their readiness index.",
  "Report Generation": "You are the Report Generation Agent. You compile pitch decks, executive summaries, and due diligence briefs. Focus on storytelling and investor appeal."
};

export async function POST(req: Request) {
  try {
    const { agentName, message, history, projectContext } = await req.json();
    const userApiKey = req.headers.get("x-gemini-api-key") || "";

    const systemPrompt = agentSystemPrompts[agentName] || "You are a helpful AI specialist agent for VentureIQ.";

    // Compile dynamic context from the active project state
    let contextStr = "No active project data yet.";
    if (projectContext && Object.keys(projectContext).length > 0) {
      contextStr = JSON.stringify(projectContext, null, 2);
    }

    // Build model messages
    const messages = [
      {
        role: "system",
        content: `${systemPrompt}\n\nYou are discussing the active startup project. Here is the context gathered about this project by the VentureIQ pipeline so far:\n\`\`\`json\n${contextStr}\n\`\`\`\n\nAnswer the user's questions about the project or your role. Keep your answers concise, practical, and highly relevant to the provided project context. Speak directly, do not use generic filler.`
      }
    ];

    // Append chat history
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text
        });
      });
    }

    // Append current message
    messages.push({
      role: "user",
      content: message
    });

    // Run the request in the dynamic API key context
    const response = await apiKeyStorage.run(userApiKey, async () => {
      const completion = await llm.invoke(messages);
      return completion.content;
    });

    return NextResponse.json({ text: response });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
