import { generateText } from "ai";
import { vertexAiCall } from "../model-router";
import { type Startup } from "@/generated/client";

export async function generateEscalationHandoffNote({
  startup,
  analystNote,
  escalatedBy,
  diligenceSummary,
}: {
  startup: Partial<Startup>;
  analystNote?: string;
  escalatedBy: string;
  diligenceSummary?: string;
}): Promise<string> {
  const prompt = `
You are an expert Chief of Staff at a top-tier Venture Capital firm.
Your task is to write a highly professional, structured Investment Committee (IC) Handoff Note for an escalated deal.

**DEAL CONTEXT:**
- Startup Name: ${startup.name || "Unknown"}
- Category: ${startup.category || "General"}
- Stage: ${startup.stage || "Early"}
- Tagline: ${startup.tagline || ""}
- Traction/ARR: ${startup.traction || "Not disclosed"}
- Target Amount: ${startup.targetAmount || "Not disclosed"}

**ESCALATION CONTEXT:**
- Escalated By: ${escalatedBy}
- Analyst's Manual Note (Crucial Context): ${analystNote || "No manual note provided. Escalate for standard IC review."}

**AI DILIGENCE SUMMARY (If available):**
${diligenceSummary || "No automated AI diligence ran for this deal."}

**REQUIREMENTS:**
Write a Markdown-formatted IC Memo covering:
1. **Executive Summary**: A concise 2-sentence summary of the startup and exactly why it is being escalated to the IC today.
2. **Analyst Context**: A synthesized version of the Analyst's manual note, framing it as the primary sponsor's viewpoint.
3. **Key Strengths & Traction**: Bullet points on why this deal is exciting (using the deal context).
4. **Primary Risks & Mitigants**: Bullet points on the main risks (derive from AI diligence summary if available, or infer baseline risks for the sector/stage).
5. **Requested Actions for IC**: 2-3 specific, actionable questions or decisions the IC needs to make next (e.g., "Approve deep dive into tech stack", "Authorize Partner Meeting", "Check conflict of interest with Portfolio Co X").

**TONE:** Concise, analytical, high-signal-to-noise ratio. Avoid fluff. Format beautifully in Markdown with appropriate headings.
`;

  try {
    const response = await vertexAiCall({
      model: "orchestrator",
      messages: [{ role: "user", content: prompt }]
    });
    return response.content;
  } catch (error) {
    console.error("[generateEscalationHandoffNote] Error:", error);
    throw new Error("Failed to generate AI Handoff Note");
  }
}
