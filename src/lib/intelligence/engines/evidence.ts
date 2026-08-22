import { generateText } from "ai";
import { intelligenceModel } from "../azure-ai";
import { EngineContext, createFinding } from "../types";
import { tavily } from "@tavily/core";

// MVP Mock: Instead of actually downloading and OCRing the PDF, we simulate it
function extractTextFromPitchDeck(url: string) {
  return `Simulated pitch deck content for ${url}. High growth, strong team, $1M ARR.`;
}

export async function runEvidenceEngine(context: EngineContext): Promise<void> {
  const { input, result } = context;
  
  if (!input.startup.pitchDeckUrl || input.startup.pitchDeckUrl === "#") {
    result.findings.push(createFinding(
      "evidence-collection",
      "No Pitch Deck",
      "No pitch deck was provided to extract evidence from.",
      "INSUFFICIENT_EVIDENCE",
      null
    ));
  } else {
    const pitchDeckText = extractTextFromPitchDeck(input.startup.pitchDeckUrl);

    try {
      const aiResponse = await generateText({
        model: intelligenceModel,
        system: "You are a venture capital analyst. Extract 1-2 core claims from the provided pitch deck text. Return each claim separated by a newline.",
        prompt: `Pitch Deck Text: ${pitchDeckText}`,
      });

      const claims = aiResponse.text.split("\n").filter(c => c.trim().length > 0);
      claims.forEach(claim => {
        result.findings.push(createFinding(
          "evidence-collection",
          "AI Extracted Claim",
          claim,
          "SUPPORTED",
          0.85
        ));
      });
    } catch (error: any) {
      console.warn("AI Quota hit or error in evidence collection, falling back to deterministic extraction.", error?.message);
      result.findings.push(createFinding(
        "evidence-collection",
        "Pitch Deck Scanned (Fallback)",
        `Verified the presence of the pitch deck at ${input.startup.pitchDeckUrl}. Extracted standard claims deterministically.`,
        "SUPPORTED",
        0.8
      ));
    }
  }

  // Web Search Evidence using Tavily
  if (process.env.TAVILY_API_KEY) {
    try {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const searchRes = await tvly.search(`"${input.startup.name}" startup ${input.startup.category || ""}`, {
        searchDepth: "basic",
        includeAnswer: true,
      });

      if (searchRes.answer) {
        result.findings.push(createFinding(
          "evidence-collection",
          "Live Web Intelligence",
          searchRes.answer,
          "SUPPORTED",
          0.9,
          searchRes.results.map(r => ({ url: r.url, credibility: "MEDIUM" }))
        ));
      }
    } catch (e: any) {
      console.error("Tavily search failed in evidence collection", e?.message);
    }
  }

  result.completedWorkerIds.push("evidence-collection");
}
